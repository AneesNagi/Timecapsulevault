import { useState, useEffect, useCallback, useRef, useContext } from 'react'
import { ethers } from 'ethers'
import { TimeCapsuleVaultABI, VaultFactoryABI, ERC20TimeCapsuleVaultABI } from '../contracts/abis'
import { 
  getVaultFactoryContract, 
  getCurrentEthPrice, 
  CHAINLINK_PRICE_FEED_ABI 
} from '../utils/contracts'
import { getContractError } from '../utils/errors'
import { SUPPORTED_NETWORKS } from '../constants/networks.js'
import { useToast } from '@chakra-ui/react'
import { NetworkContext } from '../components/DAppLayout'

export interface VaultData {
  address: string;
  balance: bigint;
  lockType: 'time' | 'price' | 'goal';
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
  isLocked: boolean;
  unlockReason: string;
}

export const useVault = () => {
  const [selectedWallet, setSelectedWallet] = useState<{address: string, privateKey: string, network: string} | null>(null);
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [vaults, setVaults] = useState<VaultData[]>([])
  const [currentEthPrice, setCurrentEthPrice] = useState<bigint>(0n)
  const [provider, setProvider] = useState<ethers.JsonRpcProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Wallet | null>(null);
  const [isWalletInitialized, setIsWalletInitialized] = useState(false);
  const toast = useToast();
  const { network: selectedNetwork } = useContext(NetworkContext);

  // Track vaults that have been auto-withdrawn in this session
  const autoWithdrawnVaults = useRef<Set<string>>(new Set());

  // Set up provider and wallet when component mounts
  useEffect(() => {
    const initializeWallet = async () => {
    const savedWallets = localStorage.getItem('wallets');
    if (savedWallets) {
      const parsedWallets = JSON.parse(savedWallets);
      if (parsedWallets.length > 0) {
        const wallet = parsedWallets[0]; // Use first wallet by default
        setSelectedWallet(wallet);
        
        // Create provider based on selected network (not wallet's stored network)
        const network = selectedNetwork;
        if (network) {
          try {
            // Create provider and signer first (these don't require network calls)
          const provider = new ethers.JsonRpcProvider(network.rpc[0]);
            const signer = new ethers.Wallet(wallet.privateKey, provider);
            
            // Set provider and signer immediately
          setProvider(provider);
            setSigner(signer);
            
            // Mark wallet as initialized immediately - we have enough to work
            setIsWalletInitialized(true);
            
            console.log('Wallet setup completed (basic):', {
              address: wallet.address,
              network: wallet.network,
              rpcUrl: network.rpc[0],
              signerAddress: signer.address,
            });
            
            // Test connection in background with rate limiting (optional)
            // rateLimitedRpcCall(async () => {
            //   try {
            //     await provider.getBlockNumber();
            //     console.log('Provider connection test successful');
            //   } catch (testError) {
            //     console.warn('Provider connection test failed (non-critical):', testError);
            //     // Don't fail initialization - manual operations can still work
            //   }
            // });
            
            // Wallet initialization complete
          } catch (error) {
            console.error('Error initializing wallet:', error);
            setError('Failed to initialize wallet connection');
          }
        }
      }
    }
    };

    initializeWallet();
  }, [selectedNetwork]);

  // Fetch current ETH price periodically
  useEffect(() => {
    const fetchCurrentEthPrice = async () => {
      if (!provider || !selectedNetwork) return;

      const fetchPrice = async () => {
        try {
          // await rateLimitedRpcCall(async () => {
          const priceFeedConfig = getCurrentEthPrice(selectedNetwork.chainId);
          
          // Check if we have a valid price feed address
          if (!priceFeedConfig.address || priceFeedConfig.address === '0x0000000000000000000000000000000000000000') {
            console.log('Price feed not configured yet - contracts need to be deployed');
            return;
          }
          
          const priceFeed = new ethers.Contract(
            priceFeedConfig.address as string,
            CHAINLINK_PRICE_FEED_ABI,
            provider
          );
          
          const priceData = await priceFeed.latestRoundData();
          setCurrentEthPrice(BigInt(priceData[1].toString()));
          // });
        } catch (err) {
          console.error('Error fetching current ETH price:', err);
          // Don't set error for price feed issues as they're not critical for core functionality
        }
      };

      if (provider && selectedNetwork) {
        fetchPrice();
        const interval = setInterval(fetchPrice, 60000); // Update every 60 seconds to reduce rate limiting
        return () => clearInterval(interval);
      }
    };

    fetchCurrentEthPrice();
  }, [provider, selectedNetwork]);

  const fetchVaultDetails = useCallback(async (vaultAddress: string): Promise<VaultData | null> => {
    if (!provider || !selectedWallet || !selectedNetwork) return null;

    try {
      // return await rateLimitedRpcCall(async () => {
        const vaultContract = new ethers.Contract(vaultAddress, TimeCapsuleVaultABI, provider);
        const priceFeedConfig = getCurrentEthPrice(selectedNetwork.chainId);
        const priceFeed = new ethers.Contract(
          priceFeedConfig.address as string,
          CHAINLINK_PRICE_FEED_ABI,
          provider
        );
        
        // First try to get basic vault info
        const [balance, unlockTime, creator, actualTargetPrice] = await Promise.all([
          provider.getBalance(vaultAddress),
          vaultContract.unlockTime(),
          vaultContract.creator(),
          vaultContract.targetPrice(),
        ]);
        
        // Try to get lock status, but handle gracefully if it fails
        let isLocked = true;
        let timeRemaining = 0;
        let isPriceBased = false;
        let isGoalBased = false;
        let currentAmount = 0n;
        let goalAmount = 0n;
        let progressPercentage = 0;
        let unlockReason = 'Vault is locked';
        
        try {
          const lockStatus = await vaultContract.getLockStatus();
          // lockStatus: [isLocked, currentPrice, timeRemaining, isPriceBased, isGoalBased, currentAmount, goalAmount, progressPercentage, unlockReason]
          [isLocked, , timeRemaining, isPriceBased, isGoalBased, currentAmount, goalAmount, progressPercentage, unlockReason] = lockStatus;
        } catch (lockStatusError) {
          console.warn(`getLockStatus failed for vault ${vaultAddress}, using fallback logic:`, lockStatusError);
          // Fallback: determine lock status based on time
          const currentTime = Math.floor(Date.now() / 1000);
          timeRemaining = Number(unlockTime) - currentTime;
          isLocked = timeRemaining > 0;
          // For fallback, assume it's a time lock if we can't determine the type
          isPriceBased = false;
          isGoalBased = false;
          unlockReason = isLocked ? 'Time lock active' : 'Vault unlocked';
        }
        
        // Get current price
        let currentPriceResult;
        try {
          currentPriceResult = await priceFeed.latestRoundData();
        } catch (priceError) {
          console.warn(`Price feed failed for vault ${vaultAddress}:`, priceError);
          currentPriceResult = [0, 0, 0, 0, 0]; // Fallback
        }
        
        const currentTime = Math.floor(Date.now() / 1000);
        const remainingSeconds = Number(unlockTime) - currentTime;

        const isPriceLocked = isPriceBased;
        const isGoalLocked = isGoalBased;
        const isTimeLocked = isLocked && !isPriceLocked && !isGoalLocked;
        let lockType: 'time' | 'price' | 'goal' = 'time';
        if (isPriceLocked) lockType = 'price';
        if (isGoalLocked) lockType = 'goal';

        return {
          address: vaultAddress,
          balance: BigInt(balance.toString()),
          unlockTime: BigInt(unlockTime.toString()),
          targetPrice: BigInt(actualTargetPrice.toString()),
          goalAmount: BigInt(goalAmount?.toString() || '0'),
          currentAmount: BigInt(currentAmount?.toString() || '0'),
          progressPercentage: Number(progressPercentage),
          currentPrice: BigInt(currentPriceResult[1].toString()),
          remainingTime: remainingSeconds > 0 ? remainingSeconds : 0,
          creator,
          isTimeLocked,
          isPriceLocked,
          isGoalLocked,
          lockType,
          isLocked: isLocked,
          unlockReason: unlockReason,
        };
      // });
    } catch (err) {
      // Only filter out specific errors that definitely indicate old/incompatible vaults
      if (err instanceof Error && err.message.includes('execution reverted')) {
        console.log(`Vault ${vaultAddress} is not compatible with current interface`);
        return null;
      }
      throw err;
    }
  }, [provider, selectedWallet]);

  const fetchERC20VaultDetails = useCallback(async (vaultAddress: string): Promise<VaultData | null> => {
    if (!provider || !selectedWallet || !selectedNetwork) return null;

    try {
      // return await rateLimitedRpcCall(async () => {
        const vaultContract = new ethers.Contract(vaultAddress, ERC20TimeCapsuleVaultABI, provider);
        
        // Get basic vault info
        const [unlockTime, creator, actualTargetPrice] = await Promise.all([
          vaultContract.unlockTime(),
          vaultContract.creator(),
          vaultContract.targetPrice(),
        ]);
        
        // Get token info
        const tokenAddress = await vaultContract.tokenAddress();
        const tokenContract = new ethers.Contract(tokenAddress, [
          "function balanceOf(address account) external view returns (uint256)",
          "function decimals() external view returns (uint8)",
          "function symbol() external view returns (string)"
        ], provider);
        
        const [balance, tokenDecimals, tokenSymbol] = await Promise.all([
          tokenContract.balanceOf(vaultAddress),
          tokenContract.decimals(),
          tokenContract.symbol()
        ]);
        
        // Get lock status using ERC-20 vault functions
        let isLocked = true;
        let currentPrice = 0n;
        let timeRemaining = 0;
        let isPriceBased = false;
        let isGoalBased = false;
        let currentAmount = 0n;
        let goalAmount = 0n;
        let progressPercentage = 0;
        let unlockReason = 'ERC-20 vault is locked';
        
        try {
          // Use ERC-20 vault specific functions
          const [isUnlocked, vaultBalance, currentPriceResult] = await Promise.all([
            vaultContract.isUnlocked(),
            vaultContract.getBalance(),
            vaultContract.getCurrentPrice()
          ]);
          
          isLocked = !isUnlocked;
          currentAmount = BigInt(vaultBalance.toString());
          currentPrice = BigInt(currentPriceResult.toString());
          
          // Determine lock type based on target price and amount
          const targetAmount = await vaultContract.targetAmount();
          goalAmount = BigInt(targetAmount.toString());
          
          if (goalAmount > 0n) {
            isGoalBased = true;
            progressPercentage = Number((currentAmount * 100n) / goalAmount);
            unlockReason = `ERC-20 goal lock: ${ethers.formatUnits(currentAmount, tokenDecimals)}/${ethers.formatUnits(goalAmount, tokenDecimals)} ${tokenSymbol}`;
          } else if (actualTargetPrice > 0n) {
            isPriceBased = true;
            unlockReason = `ERC-20 price lock: ${ethers.formatUnits(currentPrice, 8)} USD`;
          } else {
            unlockReason = isLocked ? 'ERC-20 time lock active' : 'ERC-20 vault unlocked';
          }
          
          // Calculate remaining time
          const currentTime = Math.floor(Date.now() / 1000);
          timeRemaining = Number(unlockTime) - currentTime;
          
        } catch (lockStatusError) {
          console.warn(`ERC-20 vault status check failed for ${vaultAddress}, using fallback logic:`, lockStatusError);
          // Fallback: determine lock status based on time
          const currentTime = Math.floor(Date.now() / 1000);
          timeRemaining = Number(unlockTime) - currentTime;
          isLocked = timeRemaining > 0;
          // For fallback, assume it's a time lock if we can't determine the type
          isPriceBased = false;
          isGoalBased = false;
          unlockReason = isLocked ? 'ERC-20 time lock active' : 'ERC-20 vault unlocked';
        }
        
        const currentTime = Math.floor(Date.now() / 1000);
        const remainingSeconds = Number(unlockTime) - currentTime;

        const isPriceLocked = isPriceBased;
        const isGoalLocked = isGoalBased;
        const isTimeLocked = isLocked && !isPriceLocked && !isGoalLocked;
        let lockType: 'time' | 'price' | 'goal' = 'time';
        if (isPriceLocked) lockType = 'price';
        if (isGoalLocked) lockType = 'goal';

        return {
          address: vaultAddress,
          balance: BigInt(balance.toString()),
          unlockTime: BigInt(unlockTime.toString()),
          targetPrice: BigInt(actualTargetPrice.toString()),
          goalAmount: BigInt(goalAmount?.toString() || '0'),
          currentAmount: BigInt(currentAmount?.toString() || '0'),
          progressPercentage: Number(progressPercentage),
          currentPrice: currentPrice,
          remainingTime: remainingSeconds > 0 ? remainingSeconds : 0,
          creator,
          isTimeLocked,
          isPriceLocked,
          isGoalLocked,
          lockType,
          isLocked: isLocked,
          unlockReason: unlockReason,
        };
      // });
    } catch (err) {
      console.warn(`Error fetching ERC-20 vault ${vaultAddress}:`, err);
      return null;
    }
  }, [provider, selectedWallet]);

  // Load all vaults on mount or when wallet changes
  useEffect(() => {
    const loadAllVaults = async () => {
      if (!selectedWallet || !provider || !signer) return;

      setIsLoading(true);
      setError(null);
      try {
        // await rateLimitedRpcCall(async () => {
          // First verify the contract exists
          const factoryConfig = getVaultFactoryContract(selectedNetwork.chainId);
          const code = await provider.getCode(factoryConfig.address);
          if (!code || code === '0x') {
            setError(`Vault factory contract not deployed at the specified address. Make sure you have deployed the contracts to ${selectedNetwork.name}.`);
            setIsLoading(false);
            return;
          }

          const factoryContract = new ethers.Contract(
            factoryConfig.address,
            VaultFactoryABI,
            provider
          );
          
          const vaultAddresses = await factoryContract.getUserVaults(selectedWallet.address);
          
          if (!vaultAddresses) {
            throw new Error('Invalid response from getUserVaults');
          }

          // Check vault types and fetch details accordingly
          const fetchedVaultDetails = await Promise.all(
            vaultAddresses.map(async (vaultAddress: string) => {
              try {
                // First check if the vault contract exists
                const vaultCode = await provider.getCode(vaultAddress);
                if (!vaultCode || vaultCode === '0x') {
                  console.warn(`Vault contract ${vaultAddress} does not exist or is not deployed`);
                  return null;
                }

                // Check if this is an ERC-20 vault with better error handling
                let isERC20Vault = false;
                try {
                  isERC20Vault = await factoryContract.isERC20Vault(vaultAddress);
                  console.log(`Vault ${vaultAddress} type check successful: ${isERC20Vault ? 'ERC-20' : 'Native'}`);
                } catch (typeCheckError) {
                  console.warn(`Error checking vault type for ${vaultAddress}:`, typeCheckError);
                  // If we can't determine the type, assume it's a native vault
                  isERC20Vault = false;
                }

                if (isERC20Vault) {
                  // For ERC-20 vaults, use the ERC-20 vault fetching logic
                  console.log(`Vault ${vaultAddress} is an ERC-20 vault`);
                  return await fetchERC20VaultDetails(vaultAddress);
                } else {
                  // Native vault - use existing logic
                  console.log(`Vault ${vaultAddress} is a native vault`);
                  return await fetchVaultDetails(vaultAddress);
                }
              } catch (error) {
                console.warn(`Error processing vault ${vaultAddress}:`, error);
                // Return null to filter out problematic vaults
                return null;
              }
            })
          );

          function isVaultData(vault: VaultData | null): vault is VaultData {
            return Boolean(vault);
          }

          // Only update vaults if we successfully fetched some data
          const validVaults = fetchedVaultDetails.filter(isVaultData);
          if (validVaults.length > 0) {
            // Filter out vaults with 0 balance AND no loading state (truly empty/withdrawn vaults)
            const activeVaults = validVaults.filter(vault => 
              vault.balance > 0n || vault.unlockReason === 'Loading vault data...'
            );
            setVaults(activeVaults);
          } else if (vaultAddresses.length === 0) {
            // No vaults exist for this user
            setVaults([]);
          }
          // If no valid vaults but we have addresses, keep existing vaults (rate limit/network issue scenario)
        // });
      } catch (err) {
        console.error('Error loading all vaults:', err);
        setError(getContractError(err));
      } finally {
        setIsLoading(false);
      }
    };

    loadAllVaults();
  }, [selectedWallet, provider, signer, fetchVaultDetails, fetchERC20VaultDetails, selectedNetwork]);



  const createNewVault = useCallback(async (unlockTime: number, targetPrice: number, targetAmount: number): Promise<string> => {
    if (!signer || !selectedNetwork || !selectedWallet) {
      throw new Error('Wallet not connected or network not selected');
    }

    console.log('Starting vault creation with params:', { unlockTime, targetPrice, targetAmount });
    
    // return await rateLimitedRpcCall(async () => {
    // First verify if the factory contract exists
    const factoryConfig = getVaultFactoryContract(selectedNetwork.chainId);
    
    // Check if we have a valid factory address
    if (!factoryConfig.address) {
      throw new Error('Vault factory not deployed yet. Please deploy contracts first using: npm run deploy:arbitrum-sepolia');
    }
    
    const factory = new ethers.Contract(
      factoryConfig.address,
      VaultFactoryABI,
      signer
    );

    console.log('Contract exists, creating vault...');

    // Create the vault
    const priceFeedConfig = getCurrentEthPrice(selectedNetwork.chainId);
    console.log('Calling createVault with params:', [unlockTime, targetPrice, targetAmount, priceFeedConfig.address]);
    
    const tx = await factory.createVault(
      BigInt(unlockTime),
      BigInt(targetPrice),
      BigInt(targetAmount),
      priceFeedConfig.address
    );

    console.log('Transaction submitted:', tx.hash);

    // Wait for transaction to be mined
    const receipt = await tx.wait();
    console.log('Transaction confirmed:', receipt);

    // Get the vault address by querying the contract directly
    const userVaults = await factory.getUserVaults(selectedWallet.address);
    if (!userVaults || userVaults.length === 0) {
      throw new Error('No vaults found after creation. Please try again.');
    }
    const vaultAddress = userVaults[userVaults.length - 1];
    console.log('New vault created at:', vaultAddress);

    // Refresh vaults list
    const vaultDetails = await fetchVaultDetails(vaultAddress);
    if (vaultDetails) {
      setVaults(prevVaults => [...prevVaults, vaultDetails]);
    }

    return vaultAddress;
  }, [signer, selectedNetwork, selectedWallet]);

  const createERC20Vault = async (
    unlockTime: number,
    targetPrice: number,
    targetAmount: number = 0,
    tokenAddress: string
  ): Promise<string | undefined> => {
    if (!signer || !provider || !selectedWallet) {
      setError('No wallet selected');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Starting ERC-20 vault creation with params:', { unlockTime, targetPrice, targetAmount, tokenAddress });
      
      // return await rateLimitedRpcCall(async () => {
        // First verify if the factory contract exists
        const factoryConfig = getVaultFactoryContract(selectedNetwork.chainId);
        const code = await provider.getCode(factoryConfig.address);
        if (!code || code === '0x') {
          setError(`Vault factory contract not deployed. Please deploy the contract first to ${selectedNetwork.name}.`);
          return;
        }

        console.log('Contract exists, creating ERC-20 vault...');

        // Create the ERC-20 vault
        const factoryContract = new ethers.Contract(
          factoryConfig.address,
          VaultFactoryABI,
          signer
        );

        const priceFeedConfig = getCurrentEthPrice(selectedNetwork.chainId);
        console.log('Calling createERC20Vault with params:', [unlockTime, targetPrice, targetAmount, priceFeedConfig.address, tokenAddress]);
        
        const tx = await factoryContract.createERC20Vault(
          BigInt(unlockTime),
          BigInt(targetPrice),
          BigInt(targetAmount),
          priceFeedConfig.address,
          tokenAddress
        );

        console.log('ERC-20 vault transaction submitted:', tx.hash);

        // Wait for transaction to be mined
        const receipt = await tx.wait();
        console.log('ERC-20 vault transaction confirmed:', receipt);

        // Get the vault address by querying the contract directly
        const userVaults = await factoryContract.getUserVaults(selectedWallet.address);
        if (!userVaults || userVaults.length === 0) {
          throw new Error('No vaults found after creation. Please try again.');
        }
        const vaultAddress = userVaults[userVaults.length - 1];
        console.log('New ERC-20 vault created at:', vaultAddress);

        // Refresh vaults list
        const vaultDetails = await fetchVaultDetails(vaultAddress);
        if (vaultDetails) {
          setVaults(prevVaults => [...prevVaults, vaultDetails]);
        }

        return vaultAddress;
      // });
    } catch (err) {
      console.error('Error creating ERC-20 vault:', err);
      const errorMessage = getContractError(err);
      console.error('Parsed error message:', errorMessage);
      setError(errorMessage);
      return undefined;
    } finally {
      setIsLoading(false);
    }
  };

  const deposit = async (amount: string, vaultAddress: string): Promise<boolean> => {
    if (!signer || !provider || !selectedWallet) {
      setError('No wallet selected');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Use the vault contract's deposit function instead of a direct transfer
      const vaultContract = new ethers.Contract(
        vaultAddress,
        TimeCapsuleVaultABI,
        signer
      );
      
      // Call the deposit function with the ETH value
      const tx = await vaultContract.deposit({
        value: ethers.parseEther(amount)
      });

      console.log('Deposit transaction submitted:', tx.hash);

      // Wait for transaction to be mined
      const receipt = await tx.wait();
      console.log('Deposit transaction confirmed:', receipt);

      // Update the vault details
      const updatedVaultDetails = await fetchVaultDetails(vaultAddress);
      if (updatedVaultDetails) {
        setVaults(prevVaults =>
          prevVaults.map(v => (v.address === vaultAddress ? updatedVaultDetails : v))
        );
      }

      return true;
    } catch (err) {
      console.error('Error depositing to vault:', err);
      setError(getContractError(err));
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const depositERC20 = async (amount: string, vaultAddress: string, tokenAddress: string): Promise<boolean> => {
    console.log('=== ERC-20 DEPOSIT FUNCTION STARTED ===');
    console.log('Parameters:', { amount, vaultAddress, tokenAddress, signer: !!signer, selectedWallet: !!selectedWallet });

    if (!signer || !selectedWallet) {
      console.log('Early exit: Missing signer or selected wallet');
      setError('No wallet selected or signer not available');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create ERC-20 token contract instance
      const tokenContract = new ethers.Contract(
        tokenAddress,
        [
          "function approve(address spender, uint256 amount) external returns (bool)",
          "function balanceOf(address account) external view returns (uint256)",
          "function decimals() external view returns (uint8)"
        ],
        signer
      );

      // Get token decimals with better error handling
      let decimals: number;
      try {
        decimals = await tokenContract.decimals();
        console.log('Token decimals:', decimals);
      } catch (decimalsError) {
        console.error('Failed to get token decimals:', decimalsError);
        // Try to determine if this is actually a native token deposit
        if (tokenAddress === '0x0000000000000000000000000000000000000000') {
          console.log('Detected native token, switching to native deposit');
          return await deposit(amount, vaultAddress);
        }
        throw new Error(`Invalid token contract: Could not get decimals. This might not be a standard ERC-20 token.`);
      }

      const amountInWei = ethers.parseUnits(amount, decimals);

      // Check if user has enough tokens
      const balance = await tokenContract.balanceOf(selectedWallet.address);
      if (balance < amountInWei) {
        throw new Error(`Insufficient token balance. You have ${ethers.formatUnits(balance, decimals)} tokens`);
      }

      // Approve the vault to spend tokens
      console.log('Approving tokens for vault...');
      const approveTx = await tokenContract.approve(vaultAddress, amountInWei);
      await approveTx.wait();
      console.log('Token approval confirmed');

      // Use the ERC-20 vault contract's deposit function
      const vaultContract = new ethers.Contract(
        vaultAddress,
        ERC20TimeCapsuleVaultABI,
        signer
      );
      
      // Call the deposit function with the token amount (no value needed for ERC-20)
      const tx = await vaultContract.deposit(amountInWei);

      console.log('ERC-20 deposit transaction submitted:', tx.hash);

      // Wait for transaction to be mined
      const receipt = await tx.wait();
      console.log('ERC-20 deposit transaction confirmed:', receipt);

      // Update the vault details
      const updatedVaultDetails = await fetchVaultDetails(vaultAddress);
      if (updatedVaultDetails) {
        setVaults(prevVaults =>
          prevVaults.map(v => (v.address === vaultAddress ? updatedVaultDetails : v))
        );
      }

      return true;
    } catch (err) {
      console.error('Error depositing ERC-20 to vault:', err);
      setError(getContractError(err));
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const withdraw = async (vaultAddress: string): Promise<boolean> => {
    console.log('=== WITHDRAWAL FUNCTION STARTED ===');
    console.log('Parameters:', { 
      vaultAddress, 
      signer: !!signer, 
      provider: !!provider, 
      selectedWallet: !!selectedWallet,
      isWalletInitialized 
    });
    
    // For manual withdrawal, try to work even if global initialization had rate limit issues
    if (!selectedWallet) {
      console.log('Early exit: No wallet selected');
      setError('No wallet selected');
      return false;
    }

    // If signer/provider are missing but we have selectedWallet, try to recreate them
    let workingSigner = signer;
    let workingProvider = provider;
    
    if (!workingSigner || !workingProvider) {
      console.log('Missing signer/provider, attempting to recreate from selectedWallet...');
      try {
        const network = SUPPORTED_NETWORKS.find(n => n.id === selectedWallet.network);
        if (!network) {
          throw new Error('Network not found for selected wallet');
        }
        
        // Try multiple RPC endpoints for resilience
        let rpcError;
        for (const rpcUrl of network.rpc) {
          try {
            workingProvider = new ethers.JsonRpcProvider(rpcUrl);
            workingSigner = new ethers.Wallet(selectedWallet.privateKey, workingProvider);
            console.log('Successfully created working provider with RPC:', rpcUrl);
            break;
          } catch (err) {
            console.warn(`Failed to create provider with RPC ${rpcUrl}:`, err);
            rpcError = err;
            continue;
          }
        }
        
        if (!workingSigner || !workingProvider) {
          throw rpcError || new Error('All RPC endpoints failed');
        }
      } catch (error) {
        console.error('Failed to recreate signer/provider:', error);
        setError('Unable to connect to blockchain. Please try again later.');
        return false;
      }
    }

    console.log('Wallet components check passed');
    setIsLoading(true);
    setError(null);

    try {
      console.log('Starting withdrawal process for vault:', vaultAddress);
      
      // Test signer connection
      try {
        const signerAddress = await workingSigner.getAddress();
        console.log('Using signer address:', signerAddress);
      } catch (signerError) {
        console.error('Signer error:', signerError);
        throw new Error('Signer is not properly connected');
      }
      
      try {
        const network = await workingProvider.getNetwork();
        console.log('Network:', network);
      } catch (networkError) {
        console.error('Network error:', networkError);
        throw new Error('Provider is not properly connected');
      }

      // Test basic RPC call
      try {
        const blockNumber = await workingProvider.getBlockNumber();
        console.log('Current block number:', blockNumber);
      } catch (rpcError) {
        console.error('RPC error:', rpcError);
        throw new Error('Unable to connect to blockchain network');
      }

      const vaultContract = new ethers.Contract(vaultAddress, TimeCapsuleVaultABI, workingSigner);

      // Check if vault is unlocked
      console.log('Checking vault lock status...');
      let lockStatus;
      try {
        lockStatus = await vaultContract.getLockStatus();
        console.log('Lock status:', lockStatus);
      } catch (lockStatusError) {
        console.error('Lock status error:', lockStatusError);
        throw new Error('Unable to read vault status - check if vault address is correct');
      }
      
      if (lockStatus[0]) {
        throw new Error(`Vault is still locked: ${lockStatus[8]}`); // unlockReason is at index 8
      }

      // Verify we're on the correct network
      const network = await workingProvider.getNetwork();
      console.log('Current network:', network);
      if (network.chainId !== BigInt(selectedNetwork.chainId)) {
        throw new Error(`Please switch to ${selectedNetwork.name} to withdraw from this vault`);
      }

      // Check if vault has balance
      console.log('Checking vault balance...');
      const balance = await workingProvider.getBalance(vaultAddress);
      console.log('Vault balance:', ethers.formatEther(balance), 'ETH');
      
      if (balance === 0n) {
        throw new Error('Vault has no balance to withdraw');
      }

      console.log(`Withdrawing ${ethers.formatEther(balance)} ETH from vault ${vaultAddress}`);

      // Check gas estimation
      console.log('Estimating gas for withdrawal...');
      const gasEstimate = await vaultContract.withdraw.estimateGas();
      console.log('Estimated gas:', gasEstimate.toString());

      // Get current gas price
      const gasPrice = await workingProvider.getFeeData();
      console.log('Current gas price:', ethers.formatUnits(gasPrice.gasPrice || 0n, 'gwei'), 'gwei');

      // Withdraw funds with explicit gas settings
      const tx = await vaultContract.withdraw({
        gasLimit: (gasEstimate * 120n) / 100n, // Add 20% buffer
        maxFeePerGas: gasPrice.maxFeePerGas,
        maxPriorityFeePerGas: gasPrice.maxPriorityFeePerGas,
      });
      
      console.log('Withdrawal transaction submitted:', tx.hash);
      console.log('Transaction details:', {
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        gasLimit: tx.gasLimit?.toString(),
        maxFeePerGas: tx.maxFeePerGas?.toString(),
        maxPriorityFeePerGas: tx.maxPriorityFeePerGas?.toString(),
      });

      // Wait for transaction to be mined
      console.log('Waiting for transaction confirmation...');
      const receipt = await tx.wait();
      console.log('Withdrawal transaction confirmed:', {
        hash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed?.toString(),
        status: receipt.status,
      });

      // Verify the withdrawal actually happened
      const newBalance = await workingProvider.getBalance(vaultAddress);
      console.log('Vault balance after withdrawal:', ethers.formatEther(newBalance), 'ETH');

      if (newBalance > 0n) {
        console.warn('Warning: Vault still has balance after withdrawal attempt');
      }

      // Update vaults list (remove this vault)
      setVaults(prevVaults => prevVaults.filter(v => v.address !== vaultAddress));

      return true;
    } catch (err) {
      console.error('=== WITHDRAWAL ERROR CAUGHT ===');
      console.error('Error withdrawing from vault:', err);
      console.error('Error details:', {
        name: (err as any).name,
        message: (err as any).message,
        code: (err as any).code,
        data: (err as any).data,
        transaction: (err as any).transaction,
      });
      
      const errorMessage = getContractError(err);
      console.log('Processed error message:', errorMessage);
      setError(errorMessage);
      return false;
    } finally {
      console.log('=== WITHDRAWAL FUNCTION ENDED ===');
      setIsLoading(false);
    }
  };

  // Enhanced auto-withdrawal system with on-chain automation integration
  useEffect(() => {
    if (!isWalletInitialized || !signer || !provider || !selectedWallet || vaults.length === 0) {
      return;
    }

    console.log('🚀 Setting up enhanced auto-withdrawal system with on-chain automation...');
    
    // Track auto-withdrawal attempts to prevent spam
    const autoWithdrawalAttempts = new Map<string, number>();
    const maxAttempts = 3;
    const attemptCooldown = 5 * 60 * 1000; // 5 minutes

    const checkAndTriggerAutoWithdrawal = async (vault: VaultData) => {
      const vaultAddress = vault.address;
      
      // Check if we've tried too many times recently
      const lastAttempt = autoWithdrawalAttempts.get(vaultAddress) || 0;
      const attempts = autoWithdrawalAttempts.get(vaultAddress + '_count') || 0;
      
      if (attempts >= maxAttempts && Date.now() - lastAttempt < attemptCooldown) {
        console.log(`Vault ${vaultAddress} has reached max auto-withdrawal attempts, skipping`);
        return;
      }

      try {
        console.log(`🔍 Checking vault ${vaultAddress} for auto-withdrawal...`);
        
        // await rateLimitedRpcCall(async () => {
          const vaultContract = new ethers.Contract(vaultAddress, TimeCapsuleVaultABI, provider);
          
          // First, try to use the smart contract's canAutoWithdraw function
          let canUnlock = false;
          let reason = "Unknown";
          
          try {
            const [canUnlockResult, reasonResult] = await vaultContract.canAutoWithdraw();
            canUnlock = canUnlockResult;
            reason = reasonResult;
            console.log(`Vault ${vaultAddress} auto-withdrawal check:`, { canUnlock, reason });
          } catch (abiError) {
            console.log(`Smart contract auto-withdrawal functions not available for vault ${vaultAddress}, using fallback method`);
            
            // Fallback: Use the existing getLockStatus function
            try {
              const lockStatus = await vaultContract.getLockStatus();
              canUnlock = !lockStatus[0]; // isLocked is at index 0
              reason = lockStatus[8]; // unlockReason is at index 8
              console.log(`Vault ${vaultAddress} fallback check:`, { canUnlock, reason });
            } catch (fallbackError) {
              console.error(`Failed to check vault ${vaultAddress} status:`, fallbackError);
              return;
            }
          }
          
          if (canUnlock) {
            console.log(`🎯 Vault ${vaultAddress} can be auto-withdrawn! Reason: ${reason}`);
            
            // Track attempt
            autoWithdrawalAttempts.set(vaultAddress, Date.now());
            autoWithdrawalAttempts.set(vaultAddress + '_count', attempts + 1);
            
            // Try to trigger the smart contract's built-in auto-withdrawal
            console.log(`⚡ Attempting auto-withdrawal for vault ${vaultAddress}...`);
            
            try {
              // First try the smart contract's triggerAutoWithdraw function
              const tx = await vaultContract.triggerAutoWithdraw();
              console.log(`📝 Auto-withdrawal transaction submitted: ${tx.hash}`);
              
              // Wait for confirmation
              const receipt = await tx.wait();
              console.log(`✅ Auto-withdrawal confirmed! Block: ${receipt.blockNumber}`);
              
            } catch (triggerError) {
              console.log(`Smart contract auto-withdrawal not available, using manual withdrawal for vault ${vaultAddress}`);
              
              // Fallback to manual withdrawal
              try {
                const success = await withdraw(vaultAddress);
                if (!success) {
                  throw new Error('Manual withdrawal failed');
                }
              } catch (withdrawError) {
                console.error(`Manual withdrawal failed for vault ${vaultAddress}:`, withdrawError);
                throw withdrawError;
              }
            }
            
            // Check if withdrawal was successful
            const newBalance = await provider.getBalance(vaultAddress);
            if (newBalance === 0n) {
              console.log(`🎉 AUTO-WITHDRAWAL SUCCESSFUL! Vault ${vaultAddress} is now empty`);
              
              // Mark as auto-withdrawn
              autoWithdrawnVaults.current.add(vaultAddress);
              
              // Show success notification
              toast({
                title: "🎉 Auto-withdrawal successful!",
                description: `Your vault has been automatically unlocked and funds withdrawn to your wallet.`,
                status: "success",
                duration: 8000,
                isClosable: true,
                position: "top-right",
              });
              
              // Remove from vaults list
              setVaults(prevVaults => prevVaults.filter(v => v.address !== vaultAddress));
            }
          } else {
            console.log(`⏳ Vault ${vaultAddress} not ready for withdrawal: ${reason}`);
          }
        // });
        
      } catch (error) {
        console.error(`❌ Error checking vault ${vaultAddress} for auto-withdrawal:`, error);
        
        // Show error notification
        toast({
          title: "⚠️ Auto-withdrawal check failed",
          description: `Error checking vault ${vaultAddress.slice(0, 8)}... for auto-withdrawal.`,
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "top-right",
        });
      }
    };

    // Initial check for all vaults
    console.log(`🔍 Performing initial auto-withdrawal check for ${vaults.length} vaults...`);
    vaults.forEach(vault => {
      if (!autoWithdrawnVaults.current.has(vault.address) && vault.balance > 0n) {
        checkAndTriggerAutoWithdrawal(vault);
      }
    });

    // Set up polling for continuous monitoring (reduced frequency since on-chain automation handles most cases)
    const pollInterval = setInterval(() => {
      console.log(`🔄 Auto-withdrawal polling cycle (backup to on-chain automation)...`);
      
      vaults.forEach(vault => {
        if (!autoWithdrawnVaults.current.has(vault.address) && vault.balance > 0n) {
          checkAndTriggerAutoWithdrawal(vault);
        }
      });
    }, 120000); // Check every 2 minutes (reduced from 30 seconds since on-chain automation is primary)

    // Set up event listeners for real-time updates (if supported)
    const setupEventListeners = async () => {
      try {
        // Listen for AutoWithdrawal events from all vaults
        vaults.forEach(vault => {
          try {
            const vaultContract = new ethers.Contract(vault.address, TimeCapsuleVaultABI, provider);
            
            // Try to set up AutoWithdrawal event listener
            try {
              vaultContract.on('AutoWithdrawal', (creator, amount, reason) => {
                console.log(`🎉 AUTO-WITHDRAWAL EVENT DETECTED!`, {
                  vault: vault.address,
                  creator,
                  amount: ethers.formatEther(amount),
                  reason
                });
                
                // Mark as auto-withdrawn
                autoWithdrawnVaults.current.add(vault.address);
                
                // Show success notification
                toast({
                  title: "🎉 Automatic withdrawal completed!",
                  description: `${ethers.formatEther(amount)} ETH has been automatically withdrawn from your vault.`,
                  status: "success",
                  duration: 8000,
                  isClosable: true,
                  position: "top-right",
                });
                
                // Update vaults list
                setVaults(prevVaults => prevVaults.filter(v => v.address !== vault.address));
              });
            } catch (eventError) {
              console.log(`AutoWithdrawal event not available for vault ${vault.address}, skipping event listener`);
            }
            
            // Try to set up VaultUnlocked event listener
            try {
              vaultContract.on('VaultUnlocked', (reason) => {
                console.log(`🔓 VAULT UNLOCKED EVENT: ${vault.address} - ${reason}`);
                // Trigger immediate auto-withdrawal check
                checkAndTriggerAutoWithdrawal(vault);
              });
            } catch (eventError) {
              console.log(`VaultUnlocked event not available for vault ${vault.address}, skipping event listener`);
            }
            
          } catch (contractError) {
            console.warn(`Could not set up event listeners for vault ${vault.address}:`, contractError);
          }
        });
        
        console.log(`👂 Event listeners set up for ${vaults.length} vaults`);
        
      } catch (error) {
        console.warn('⚠️ Could not set up event listeners, falling back to polling:', error);
      }
    };

    setupEventListeners();

    // Cleanup function
    return () => {
      console.log('🛑 Stopping enhanced auto-withdrawal system...');
      clearInterval(pollInterval);
      
      // Remove event listeners
      vaults.forEach(vault => {
        try {
          const vaultContract = new ethers.Contract(vault.address, TimeCapsuleVaultABI, provider);
          vaultContract.removeAllListeners();
        } catch (error) {
          console.warn('Could not remove event listeners for vault:', vault.address);
        }
      });
    };
  }, [isWalletInitialized, signer, provider, selectedWallet, vaults, toast]);

  return {
    isLoading,
    error,
    vaults,
    currentEthPrice,
    createNewVault,
    createERC20Vault,
    deposit,
    depositERC20,
    withdraw,
    selectedWallet,
    setSelectedWallet,
    isWalletInitialized,
  };
}; 