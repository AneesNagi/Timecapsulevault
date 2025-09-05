import { TimeCapsuleVaultABI, VaultFactoryABI } from '@/contracts/abis'
import { parseEther } from 'viem'
import type { Address } from 'viem'

// Network-specific contract addresses (env first, then fallback to known test deployments)
// Optionally, load from deployment JSONs if present in public bundle (vite assets include JSON)
// Note: For production, prefer env values baked at build time.
const NETWORK_CONFIGS = {
  // Arbitrum Sepolia only
  421614: {
    vaultFactoryAddress: (import.meta.env.VITE_ARB_SEPOLIA_VAULT_FACTORY_ADDRESS || ((): string => {
      try {
        // @ts-ignore
        const d = require('../../deployment-arbitrum-sepolia.json');
        return d.vaultFactoryAddress;
      } catch {
        return '0x333222930ff6d5f8A5127b353422f7AA905458De';
      }
    })()) as const, // Deployed VaultFactory
    ethUsdPriceFeed: '0x2d3bBa5e0A9Fd8EAa45Dcf71A2389b7C12005b1f' as const, // ETH/USD on Arbitrum Sepolia
  },
} as const

// Default to Arbitrum Sepolia
export const VAULT_FACTORY_ADDRESS = NETWORK_CONFIGS[421614].vaultFactoryAddress
export const ETH_USD_PRICE_FEED = NETWORK_CONFIGS[421614].ethUsdPriceFeed

// Chainlink Price Feed ABI
export const CHAINLINK_PRICE_FEED_ABI = [
  {
    inputs: [],
    name: 'latestRoundData',
    outputs: [
      { internalType: 'uint80', name: 'roundId', type: 'uint80' },
      { internalType: 'int256', name: 'answer', type: 'int256' },
      { internalType: 'uint256', name: 'startedAt', type: 'uint256' },
      { internalType: 'uint256', name: 'updatedAt', type: 'uint256' },
      { internalType: 'uint80', name: 'answeredInRound', type: 'uint80' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const

// Helper function to get network-specific configuration
export const getNetworkConfig = (chainId: number) => {
  return NETWORK_CONFIGS[chainId as keyof typeof NETWORK_CONFIGS] || NETWORK_CONFIGS[421614]
}

export const getVaultContract = (address: string) => {
  return {
    address,
    abi: TimeCapsuleVaultABI,
  }
}

export const getVaultFactoryContract = (chainId?: number) => {
  const config = chainId ? getNetworkConfig(chainId) : NETWORK_CONFIGS[11155111]
  return {
    address: config.vaultFactoryAddress,
    abi: VaultFactoryABI,
  }
}

export const createVault = (unlockTime: number, targetPrice: number, targetAmount: number, chainId?: number) => {
  const config = chainId ? getNetworkConfig(chainId) : NETWORK_CONFIGS[11155111]
  const priceFeed = 'bnbUsdPriceFeed' in config ? config.bnbUsdPriceFeed : config.ethUsdPriceFeed
  
  return {
    address: config.vaultFactoryAddress,
    abi: VaultFactoryABI,
    functionName: 'createVault',
    args: [BigInt(unlockTime), BigInt(targetPrice), BigInt(targetAmount), priceFeed],
  } as const
}

export const depositToVault = (vaultAddress: string, amount: string) => ({
  address: vaultAddress as Address,
  abi: TimeCapsuleVaultABI,
  functionName: 'deposit',
  value: parseEther(amount),
} as const)

export const withdrawFromVault = (vaultAddress: string) => ({
  address: vaultAddress as Address,
  abi: TimeCapsuleVaultABI,
  functionName: 'withdraw',
} as const)

export const getVaultStatus = (vaultAddress: string) => ({
  address: vaultAddress as Address,
  abi: TimeCapsuleVaultABI,
  functionName: 'getLockStatus',
} as const)

export const getCurrentEthPrice = (chainId?: number) => {
  const config = chainId ? getNetworkConfig(chainId) : NETWORK_CONFIGS[421614]
  const priceFeed = config.ethUsdPriceFeed
  
  return {
    address: priceFeed,
    abi: CHAINLINK_PRICE_FEED_ABI,
    functionName: 'latestRoundData',
  } as const
} 