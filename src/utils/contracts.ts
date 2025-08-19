import { TimeCapsuleVaultABI, VaultFactoryABI } from '@/contracts/abis'
import { parseEther } from 'viem'
import type { Address } from 'viem'

// Network-specific contract addresses
const NETWORK_CONFIGS = {
  // Arbitrum Sepolia testnet
  421614: {
    vaultFactoryAddress: '0x3994B729338b083E50ea0c68364c7030D2Db398A' as const, // Deployed VaultFactory
    ethUsdPriceFeed: '0x3951c8992405d9668C74B13d954da79D1be46bbB' as const, // MockV3Aggregator Price Feed
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
  const config = chainId ? getNetworkConfig(chainId) : NETWORK_CONFIGS[421614]
  return {
    address: config.vaultFactoryAddress,
    abi: VaultFactoryABI,
  }
}

export const createVault = (unlockTime: number, targetPrice: number, targetAmount: number, chainId?: number) => {
  const config = chainId ? getNetworkConfig(chainId) : NETWORK_CONFIGS[421614]
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
  const priceFeed = 'bnbUsdPriceFeed' in config ? config.bnbUsdPriceFeed : config.ethUsdPriceFeed
  
  return {
    address: priceFeed,
    abi: CHAINLINK_PRICE_FEED_ABI,
    functionName: 'latestRoundData',
  } as const
} 