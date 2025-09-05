import { useCallback, useEffect, useRef, useState } from 'react';
import { ethers } from 'ethers';
import { TimeCapsuleVaultABI, VaultFactoryABI, CHAINLINK_PRICE_FEED_ABI } from '../contracts/abis';
import { getNetworkById, SUPPORTED_NETWORKS } from '../constants/networks';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface VaultData {
  address: string;
  balance: bigint;
  unlockTime: bigint;
  targetPrice: bigint;
  goalAmount: bigint;
  currentAmount: bigint;
  progressPercentage: number;
  currentPrice: bigint;
  remainingTime: number;
  creator: string;
  isTimeLocked: boolean;
  isPriceLocked: boolean;
  isGoalLocked: boolean;
  lockType: 'time' | 'price' | 'goal';
  isLocked: boolean;
  unlockReason: string;
}

const NETWORK_CONFIGS: Record<number, { vaultFactoryAddress: string; priceFeed: string } | { vaultFactoryAddress: string; priceFeed: string }> = {
  11155111: {
    vaultFactoryAddress: '0x3951c8992405d9668C74B13d954da79D1be46bbB',
    priceFeed: '0x694AA1769357215DE4FAC081bf1f309aDC325306',
  },
  421614: {
    vaultFactoryAddress: '', // Will be populated after deployment
    priceFeed: '0x9Df9a7f3C80736059D7414e1b0FCd3d775948EAe',
  },
  97: {
    vaultFactoryAddress: '0xB025cF008CF4daE512Ec1Eff9556931021c3adEC',
    priceFeed: '0x2514895c72f50D8bd4B4F9b1110F0D6bD2c97526',
  },
};

export function useVault(selectedNetworkId: string | null) {
  const [selectedWallet, setSelectedWallet] = useState<{ address: string; privateKey: string; network: string } | null>(null);
  const [provider, setProvider] = useState<ethers.JsonRpcProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Wallet | null>(null);
  const [isWalletInitialized, setIsWalletInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vaults, setVaults] = useState<VaultData[]>([]);
  const [currentEthPrice, setCurrentEthPrice] = useState<bigint>(0n);

  // Init wallet from storage
  useEffect(() => {
    const init = async () => {
      try {
        const stored = await AsyncStorage.getItem('wallets');
        if (stored) {
          const wallets = JSON.parse(stored);
          if (Array.isArray(wallets) && wallets.length > 0) {
            const wallet = wallets[0];
            setSelectedWallet(wallet);
            const net = selectedNetworkId ? getNetworkById(selectedNetworkId) : SUPPORTED_NETWORKS[0];
            if (net) {
              // Create a custom provider that prevents fallback to default RPC endpoints
              class CustomJsonRpcProvider extends ethers.JsonRpcProvider {
                constructor(url: string, network: any) {
                  super(url, network);
                }
                
                _getUrl(): string {
                  return net.rpc[0];
                }
              }

              // Fallback provider that tries multiple RPC endpoints
              class FallbackProvider extends ethers.JsonRpcProvider {
                private urls: string[];
                private network: any;
                
                constructor(urls: string[], network: any) {
                  super(urls[0], network);
                  this.urls = urls;
                  this.network = network;
                }
                
                async _send(payload: any): Promise<any> {
                  let lastError: Error | null = null;
                  
                  for (let i = 0; i < this.urls.length; i++) {
                    try {
                      const provider = new CustomJsonRpcProvider(this.urls[i], this.network);
                      return await provider._send(payload);
                    } catch (error: any) {
                      lastError = error;
                      console.warn(`RPC endpoint ${this.urls[i]} failed:`, error.message);
                      
                      // If it's a method not found error, try the next endpoint
                      if (error.message?.includes('Method not found') || 
                          error.message?.includes('eth_newFilter') ||
                          error.message?.includes('eth_getLogs') ||
                          error.message?.includes('unavailable on our public API') ||
                          error.code === -32601) {
                        continue;
                      }
                      
                      // If it's a CORS or rate limiting error, try the next endpoint
                      if (error.message?.includes('CORS') || 
                          error.message?.includes('Access-Control-Allow-Origin') ||
                          error.message?.includes('Too Many Requests') ||
                          error.message?.includes('429') ||
                          error.message?.includes('Batch of more than 3 requests') ||
                          error.message?.includes('free tier') ||
                          error.message?.includes('not valid JSON') ||
                          error.code === 429 ||
                          error.code === 31) {
                        continue;
                      }
                      
                      // For other errors, also try next endpoint
                      continue;
                    }
                  }
                  
                  throw lastError || new Error('All RPC endpoints failed');
                }
              }
              
              const p = net.rpc.length === 1 
                ? new CustomJsonRpcProvider(net.rpc[0], {
                    name: net.name,
                    chainId: net.chainId,
                    ensAddress: undefined
                  })
                : new FallbackProvider(net.rpc, {
                    name: net.name,
                    chainId: net.chainId,
                    ensAddress: undefined
                  });
              const s = new ethers.Wallet(wallet.privateKey, p);
              setProvider(p);
              setSigner(s);
              setIsWalletInitialized(true);
            }
          }
        }
      } catch (e) {
        setError('Failed to initialize wallet');
      }
    };
    init();
  }, [selectedNetworkId]);

  // Price polling
  useEffect(() => {
    if (!provider) return;
    const net = selectedNetworkId ? getNetworkById(selectedNetworkId) : SUPPORTED_NETWORKS[0];
    if (!net) return;
    const cfg = NETWORK_CONFIGS[net.chainId];
    if (!cfg) return;

    let timer: any;
    const fetchPrice = async () => {
      try {
        const priceFeed = new ethers.Contract(cfg.priceFeed, CHAINLINK_PRICE_FEED_ABI, provider);
        const data = await priceFeed.latestRoundData();
        setCurrentEthPrice(BigInt(data[1].toString()));
      } catch {}
    };
    fetchPrice();
    timer = setInterval(fetchPrice, 60000);
    return () => clearInterval(timer);
  }, [provider, selectedNetworkId]);

  const fetchVaultDetails = useCallback(
    async (vaultAddress: string): Promise<VaultData | null> => {
      if (!provider) return null;
      try {
        const vault = new ethers.Contract(vaultAddress, TimeCapsuleVaultABI, provider);
        const [balance, unlockTime, creator, targetPrice] = await Promise.all([
          provider.getBalance(vaultAddress),
          vault.unlockTime(),
          vault.creator(),
          vault.targetPrice(),
        ]);

        let locked = true;
        let timeRemaining = 0;
        let isPriceBased = false;
        let isGoalBased = false;
        let currentAmount = 0n;
        let goalAmount = 0n;
        let progressPercentage = 0;
        let unlockReason = 'Vault is locked';

        try {
          const ls = await vault.getLockStatus();
          locked = ls[0];
          timeRemaining = Number(ls[2]);
          isPriceBased = ls[3];
          isGoalBased = ls[4];
          currentAmount = BigInt(ls[5]?.toString() || '0');
          goalAmount = BigInt(ls[6]?.toString() || '0');
          progressPercentage = Number(ls[7] || 0);
          unlockReason = ls[8] || unlockReason;
        } catch {}

        const isPriceLocked = !!isPriceBased;
        const isGoalLocked = !!isGoalBased;
        const isTimeLocked = locked && !isPriceLocked && !isGoalLocked;
        const lockType: 'time' | 'price' | 'goal' = isPriceLocked ? 'price' : isGoalLocked ? 'goal' : 'time';

        return {
          address: vaultAddress,
          balance: BigInt(balance.toString()),
          unlockTime: BigInt(unlockTime.toString()),
          targetPrice: BigInt(targetPrice.toString()),
          goalAmount,
          currentAmount,
          progressPercentage,
          currentPrice: currentEthPrice,
          remainingTime: timeRemaining,
          creator,
          isTimeLocked,
          isPriceLocked,
          isGoalLocked,
          lockType,
          isLocked: locked,
          unlockReason,
        };
      } catch (e) {
        return null;
      }
    },
    [provider, currentEthPrice]
  );

  const loadAllVaults = useCallback(async () => {
    if (!selectedWallet || !provider) return;
    setIsLoading(true);
    setError(null);
    try {
      const net = selectedNetworkId ? getNetworkById(selectedNetworkId) : SUPPORTED_NETWORKS[0];
      if (!net) throw new Error('Network not found');
      const cfg = NETWORK_CONFIGS[net.chainId];
      const factory = new ethers.Contract(cfg.vaultFactoryAddress, VaultFactoryABI, provider);
      const addresses: string[] = await factory.getUserVaults(selectedWallet.address);
      const details = await Promise.all(addresses.map(fetchVaultDetails));
      setVaults(details.filter(Boolean) as VaultData[]);
    } catch (e: any) {
      setError(e?.message || 'Failed to load vaults');
    } finally {
      setIsLoading(false);
    }
  }, [selectedWallet, provider, selectedNetworkId, fetchVaultDetails]);

  useEffect(() => {
    loadAllVaults();
  }, [loadAllVaults]);

  const createNewVault = useCallback(
    async (unlockTime: number, targetPrice: number, targetAmount: number = 0): Promise<string | undefined> => {
      if (!signer || !provider || !selectedWallet) {
        setError('No wallet selected');
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const net = selectedNetworkId ? getNetworkById(selectedNetworkId) : SUPPORTED_NETWORKS[0];
        if (!net) throw new Error('Network not found');
        const cfg = NETWORK_CONFIGS[net.chainId];
        const factory = new ethers.Contract(cfg.vaultFactoryAddress, VaultFactoryABI, signer);
        const tx = await factory.createVault(BigInt(unlockTime), BigInt(targetPrice), BigInt(targetAmount), cfg.priceFeed);
        const receipt = await tx.wait();
        if (!receipt?.status) throw new Error('Transaction failed');
        await loadAllVaults();
        return tx.hash;
      } catch (e: any) {
        setError(e?.message || 'Failed to create vault');
        return undefined;
      } finally {
        setIsLoading(false);
      }
    },
    [signer, provider, selectedWallet, selectedNetworkId, loadAllVaults]
  );

  const deposit = useCallback(
    async (amount: string, vaultAddress: string): Promise<boolean> => {
      if (!signer) return false;
      setIsLoading(true);
      setError(null);
      try {
        const vault = new ethers.Contract(vaultAddress, TimeCapsuleVaultABI, signer);
        const tx = await vault.deposit({ value: ethers.parseEther(amount) });
        await tx.wait();
        await loadAllVaults();
        return true;
      } catch (e: any) {
        setError(e?.message || 'Deposit failed');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [signer, loadAllVaults]
  );

  const withdraw = useCallback(
    async (vaultAddress: string): Promise<boolean> => {
      if (!signer || !provider) return false;
      setIsLoading(true);
      setError(null);
      try {
        const vault = new ethers.Contract(vaultAddress, TimeCapsuleVaultABI, signer);
        const status = await vault.getLockStatus();
        if (status[0]) throw new Error(status[8] || 'Vault is locked');
        const gas = await vault.withdraw.estimateGas();
        const fee = await provider.getFeeData();
        const tx = await vault.withdraw({
          gasLimit: (gas * 120n) / 100n,
          maxFeePerGas: fee.maxFeePerGas,
          maxPriorityFeePerGas: fee.maxPriorityFeePerGas,
        });
        await tx.wait();
        await loadAllVaults();
        return true;
      } catch (e: any) {
        setError(e?.message || 'Withdraw failed');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [signer, provider, loadAllVaults]
  );

  // Expose a setter compatible with CreateVault screen
  const setSelectedWalletExternal = useCallback((wallet: { address: string; privateKey: string; network: string }) => {
    setSelectedWallet(wallet);
  }, []);

  return {
    isLoading,
    error,
    vaults,
    currentEthPrice,
    createNewVault,
    deposit,
    withdraw,
    selectedWallet,
    setSelectedWallet: setSelectedWalletExternal,
    isWalletInitialized,
  };
}


