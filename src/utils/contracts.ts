import { TimeCapsuleVaultABI, VaultFactoryABI } from '@/contracts/abis'
import { parseEther } from 'viem'
import type { Address } from 'viem'

// Network-specific contract addresses (env first, then fallback to known test deployments)
// Optionally, load from deployment JSONs if present in public bundle (vite assets include JSON)
// Note: For production, prefer env values baked at build time.
const NETWORK_CONFIGS = {
  // Sepolia testnet
  11155111: {
    vaultFactoryAddress: (import.meta.env.VITE_SEPOLIA_VAULT_FACTORY_ADDRESS || ((): string => {
      try {
        // @ts-ignore dynamic import may fail in dev
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const d = require('../../deployment-sepolia.json');
        return d.vaultFactoryAddress;
      } catch {
        return '0x3951c8992405d9668C74B13d954da79D1be46bbB';
      }
    })()) as const,
    ethUsdPriceFeed: '0x694AA1769357215DE4FAC081bf1f309aDC325306' as const, // ETH/USD
  },
  // Arbitrum Sepolia testnet
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
  // BSC testnet
  97: {
    vaultFactoryAddress: (import.meta.env.VITE_BSC_TESTNET_VAULT_FACTORY_ADDRESS || ((): string => {
      try {
        // @ts-ignore
        const d = require('../../deployment-bsc-testnet.json');
        return d.vaultFactoryAddress;
      } catch {
        return '0xB025cF008CF4daE512Ec1Eff9556931021c3adEC';
      }
    })()) as const,
    bnbUsdPriceFeed: '0x2514895c72f50D8bd4B4F9b1110F0D6bD2c97526' as const, // BNB/USD
  },
} as const

// Default to Sepolia for backward compatibility
export const VAULT_FACTORY_ADDRESS = NETWORK_CONFIGS[11155111].vaultFactoryAddress
export const ETH_USD_PRICE_FEED = NETWORK_CONFIGS[11155111].ethUsdPriceFeed

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
  return NETWORK_CONFIGS[chainId as keyof typeof NETWORK_CONFIGS] || NETWORK_CONFIGS[11155111]
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
  const config = chainId ? getNetworkConfig(chainId) : NETWORK_CONFIGS[11155111]
  const priceFeed = 'bnbUsdPriceFeed' in config ? config.bnbUsdPriceFeed : config.ethUsdPriceFeed
  
  return {
    address: priceFeed,
    abi: CHAINLINK_PRICE_FEED_ABI,
    functionName: 'latestRoundData',
  } as const
} 