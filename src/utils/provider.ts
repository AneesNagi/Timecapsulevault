import { ethers } from 'ethers'
import { SUPPORTED_NETWORKS } from '../constants/networks.js'

// Custom provider class that prevents fallback to default RPC endpoints
class CustomJsonRpcProvider extends ethers.JsonRpcProvider {
  private customUrl: string;
  
  constructor(url: string, network: any) {
    super(url, network);
    this.customUrl = url;
  }
  
  _getUrl(): string {
    return this.customUrl;
  }
}

// Fallback provider that tries multiple RPC endpoints
class FallbackProvider extends ethers.JsonRpcProvider {
  private urls: string[];
  private currentIndex: number = 0;
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

// Utility function to create a provider with fallback RPC endpoints
export const createProvider = (network: any): ethers.JsonRpcProvider => {
  if (network.rpc.length === 1) {
    return new CustomJsonRpcProvider(network.rpc[0], {
      name: network.name,
      chainId: network.chainId,
      ensAddress: undefined
    });
  }
  
  return new FallbackProvider(network.rpc, {
    name: network.name,
    chainId: network.chainId,
    ensAddress: undefined
  });
};

// Get network by ID
export const getNetworkById = (chainId: number) => {
  return SUPPORTED_NETWORKS.find(network => network.chainId === chainId);
};
