import { createPublicClient, http, fallback, type PublicClient } from 'viem'
import { arbitrumSepolia } from 'viem/chains'
import { SUPPORTED_NETWORKS } from '@/constants/networks'

// RPC provider configuration with retry logic
const createRpcClient = (endpoints: string[]): PublicClient => {
  return createPublicClient({
    chain: arbitrumSepolia,
    transport: fallback(
      endpoints.map(endpoint => http(endpoint)),
      {
        retryCount: 3,
        retryDelay: 1000,
      }
    ),
  })
}

// Get the primary RPC client for Arbitrum Sepolia
export const getArbitrumSepoliaClient = (): PublicClient => {
  const arbitrumSepoliaNetwork = SUPPORTED_NETWORKS.find(network => network.id === 'arbitrum-sepolia')
  if (!arbitrumSepoliaNetwork) {
    throw new Error('Arbitrum Sepolia network not found in configuration')
  }
  
  return createRpcClient(arbitrumSepoliaNetwork.rpc)
}

// Rate limiting utility
export class RateLimiter {
  private requests: number[] = []
  private maxRequests: number
  private timeWindow: number

  constructor(maxRequests: number = 100, timeWindow: number = 60000) {
    this.maxRequests = maxRequests
    this.timeWindow = timeWindow
  }

  canMakeRequest(): boolean {
    const now = Date.now()
    this.requests = this.requests.filter(time => now - time < this.timeWindow)
    
    if (this.requests.length < this.maxRequests) {
      this.requests.push(now)
      return true
    }
    
    return false
  }

  getRemainingRequests(): number {
    const now = Date.now()
    this.requests = this.requests.filter(time => now - time < this.timeWindow)
    return Math.max(0, this.maxRequests - this.requests.length)
  }
} 