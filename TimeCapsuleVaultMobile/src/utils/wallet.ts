import AsyncStorage from '@react-native-async-storage/async-storage';
import { ethers } from 'ethers';
import { SUPPORTED_NETWORKS } from '../constants/networks';

export interface WalletData {
  id: string;
  address: string;
  privateKey: string;
  network: string;
  name?: string;
  createdAt: number;
  balance?: string;
  transactionCount?: number;
  lastActivity?: number;
}

const STORAGE_KEY = 'wallets';

// Function to fetch real-time balance from blockchain
export async function fetchWalletBalance(walletAddress: string, networkId: string): Promise<string> {
  try {
    const network = SUPPORTED_NETWORKS.find((n) => n.id === networkId);
    if (!network) {
      throw new Error('Network not supported');
    }

    console.log(`Fetching balance for wallet ${walletAddress} on network: ${network.name} (${networkId})`);

    // Try multiple RPC endpoints for better reliability
    let lastError: Error | null = null;
    
    for (const rpcUrl of network.rpc) {
      try {
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        
        // Set a timeout for the RPC call
        const balanceWei = await Promise.race([
          provider.getBalance(walletAddress),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('RPC timeout')), 10000)
          )
        ]);
        
        // Convert to ether/BNB with 4 decimal places
        const balanceEth = ethers.formatEther(balanceWei);
        const result = parseFloat(balanceEth).toFixed(4);
        console.log(`Balance fetched successfully: ${result} ${network.currency} from ${rpcUrl}`);
        return result;
      } catch (rpcError) {
        lastError = rpcError as Error;
        console.warn(`RPC endpoint ${rpcUrl} failed:`, rpcError);
        continue; // Try next RPC endpoint
      }
    }
    
    // If all RPC endpoints failed
    throw lastError || new Error('All RPC endpoints failed');
  } catch (error) {
    console.error('Error fetching balance:', error);
    // Return cached balance or '0.0000' if fetch fails
    return '0.0000';
  }
}

// Function to update all wallet balances
export async function updateAllWalletBalances(): Promise<WalletData[]> {
  try {
    const wallets = await loadWallets();
    const updatedWallets = await Promise.all(
      wallets.map(async (wallet) => {
        try {
          const realBalance = await fetchWalletBalance(wallet.address, wallet.network);
          
          // Also try to get transaction count if possible
          let transactionCount = wallet.transactionCount || 0;
          try {
            const network = SUPPORTED_NETWORKS.find((n) => n.id === wallet.network);
            if (network) {
              // Create fallback provider
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
                      const provider = new ethers.JsonRpcProvider(this.urls[i], this.network);
                      return await provider._send(payload);
                    } catch (error: any) {
                      lastError = error;
                      console.warn(`RPC endpoint ${this.urls[i]} failed:`, error.message);
                      
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
                      
                      continue;
                    }
                  }
                  
                  throw lastError || new Error('All RPC endpoints failed');
                }
              }
              
              const provider = network.rpc.length === 1 
                ? new ethers.JsonRpcProvider(network.rpc[0])
                : new FallbackProvider(network.rpc, { name: network.name, chainId: network.chainId });
              const txCount = await provider.getTransactionCount(wallet.address);
              transactionCount = txCount;
            }
          } catch (txError) {
            console.warn(`Could not fetch transaction count for wallet ${wallet.id}:`, txError);
          }
          
          return {
            ...wallet,
            balance: realBalance,
            transactionCount,
            lastActivity: transactionCount > 0 ? Date.now() : wallet.lastActivity,
          };
        } catch (error) {
          console.error(`Error updating balance for wallet ${wallet.id}:`, error);
          return wallet; // Keep existing balance if update fails
        }
      })
    );
    
    // Save updated wallets
    await saveWallets(updatedWallets);
    return updatedWallets;
  } catch (error) {
    console.error('Error updating wallet balances:', error);
    return await loadWallets(); // Return existing wallets if update fails
  }
}

// Function to update balances for a specific network only
export async function updateNetworkWalletBalances(networkId: string): Promise<WalletData[]> {
  try {
    const wallets = await loadWallets();
    const networkWallets = wallets.filter(wallet => wallet.network === networkId);
    
    if (networkWallets.length === 0) {
      return wallets; // No wallets for this network
    }
    
    const updatedNetworkWallets = await Promise.all(
      networkWallets.map(async (wallet) => {
        try {
          const realBalance = await fetchWalletBalance(wallet.address, wallet.network);
          
          // Also try to get transaction count if possible
          let transactionCount = wallet.transactionCount || 0;
          try {
            const network = SUPPORTED_NETWORKS.find((n) => n.id === wallet.network);
            if (network) {
              // Create fallback provider
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
                      const provider = new ethers.JsonRpcProvider(this.urls[i], this.network);
                      return await provider._send(payload);
                    } catch (error: any) {
                      lastError = error;
                      console.warn(`RPC endpoint ${this.urls[i]} failed:`, error.message);
                      
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
                      
                      continue;
                    }
                  }
                  
                  throw lastError || new Error('All RPC endpoints failed');
                }
              }
              
              const provider = network.rpc.length === 1 
                ? new ethers.JsonRpcProvider(network.rpc[0])
                : new FallbackProvider(network.rpc, { name: network.name, chainId: network.chainId });
              const txCount = await provider.getTransactionCount(wallet.address);
              transactionCount = txCount;
            }
          } catch (txError) {
            console.warn(`Could not fetch transaction count for wallet ${wallet.id}:`, txError);
          }
          
          return {
            ...wallet,
            balance: realBalance,
            transactionCount,
            lastActivity: transactionCount > 0 ? Date.now() : wallet.lastActivity,
          };
        } catch (error) {
          console.error(`Error updating balance for wallet ${wallet.id}:`, error);
          return wallet; // Keep existing balance if update fails
        }
      })
    );
    
    // Update only the wallets for this network in the full list
    const updatedWallets = wallets.map(wallet => {
      const updatedWallet = updatedNetworkWallets.find(uw => uw.id === wallet.id);
      return updatedWallet || wallet;
    });
    
    // Save updated wallets
    await saveWallets(updatedWallets);
    return updatedWallets;
  } catch (error) {
    console.error('Error updating network wallet balances:', error);
    return await loadWallets(); // Return existing wallets if update fails
  }
}

export async function loadWallets(): Promise<WalletData[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveWallets(wallets: WalletData[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(wallets));
}

export async function createWallet(name: string, networkId: string): Promise<WalletData> {
  const wallet = ethers.Wallet.createRandom();
  const network = SUPPORTED_NETWORKS.find((n) => n.id === networkId) || SUPPORTED_NETWORKS[0];
  const data: WalletData = {
    id: `${Date.now()}`,
    address: wallet.address,
    privateKey: wallet.privateKey,
    network: network.id,
    name,
    createdAt: Date.now(),
    balance: '0.0000',
    transactionCount: 0,
    lastActivity: undefined,
  };
  const existing = await loadWallets();
  await saveWallets([data, ...existing]);
  return data;
}

export async function deleteWallet(walletId: string): Promise<void> {
  const existing = await loadWallets();
  const filtered = existing.filter(w => w.id !== walletId);
  await saveWallets(filtered);
}

export async function importWallet(name: string, privateKey: string, networkId: string): Promise<WalletData> {
  try {
    const wallet = new ethers.Wallet(privateKey);
    const network = SUPPORTED_NETWORKS.find((n) => n.id === networkId) || SUPPORTED_NETWORKS[0];
    const data: WalletData = {
      id: `${Date.now()}`,
      address: wallet.address,
      privateKey: wallet.privateKey,
      network: network.id,
      name,
      createdAt: Date.now(),
      balance: '0.0000',
      transactionCount: 0,
      lastActivity: undefined,
    };
    const existing = await loadWallets();
    await saveWallets([data, ...existing]);
    return data;
  } catch (error) {
    throw new Error('Invalid private key');
  }
}

// Function to check wallet network consistency
export async function checkWalletNetworkConsistency(): Promise<{ wallets: WalletData[]; issues: string[] }> {
  try {
    const wallets = await loadWallets();
    const issues: string[] = [];
    
    // Check if wallets have the correct network IDs
    wallets.forEach((wallet, index) => {
      const network = SUPPORTED_NETWORKS.find(n => n.id === wallet.network);
      if (!network) {
        issues.push(`Wallet ${index + 1} (${wallet.name || 'Unnamed'}) has invalid network: ${wallet.network}`);
      }
    });
    
    // Check for duplicate addresses across networks
    const addressMap = new Map<string, string[]>();
    wallets.forEach(wallet => {
      if (!addressMap.has(wallet.address)) {
        addressMap.set(wallet.address, []);
      }
      addressMap.get(wallet.address)!.push(wallet.network);
    });
    
    addressMap.forEach((networks, address) => {
      if (networks.length > 1) {
        issues.push(`Address ${address.substring(0, 8)}... exists on multiple networks: ${networks.join(', ')}`);
      }
    });
    
    return { wallets, issues };
  } catch (error) {
    return { wallets: [], issues: [`Error checking consistency: ${(error as Error).message}`] };
  }
}

// Debug function to test RPC connectivity
export async function testRPCConnection(networkId: string): Promise<{ success: boolean; error?: string; details?: any }> {
  try {
    const network = SUPPORTED_NETWORKS.find((n) => n.id === networkId);
    if (!network) {
      return { success: false, error: 'Network not supported' };
    }

    const results = [];
    
    for (const rpcUrl of network.rpc) {
      try {
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        
        // Test basic RPC functionality
        const blockNumber = await Promise.race([
          provider.getBlockNumber(),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('RPC timeout')), 10000)
          )
        ]);
        
        results.push({
          rpcUrl,
          success: true,
          blockNumber: blockNumber.toString(),
          latency: Date.now()
        });
        
        // If we get a successful response, we can break early
        break;
      } catch (rpcError) {
        results.push({
          rpcUrl,
          success: false,
          error: (rpcError as Error).message
        });
      }
    }
    
    const successfulResults = results.filter(r => r.success);
    
    if (successfulResults.length > 0) {
      return { 
        success: true, 
        details: {
          workingRPCs: successfulResults,
          totalTested: results.length
        }
      };
    } else {
      return { 
        success: false, 
        error: 'All RPC endpoints failed',
        details: results
      };
    }
  } catch (error) {
    return { 
      success: false, 
      error: (error as Error).message 
    };
  }
}


