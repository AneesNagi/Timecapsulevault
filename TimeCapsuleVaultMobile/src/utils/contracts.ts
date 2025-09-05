import { TimeCapsuleVaultABI, VaultFactoryABI, CHAINLINK_PRICE_FEED_ABI } from '../contracts/abis';

const NETWORK_CONFIGS = {
  11155111: {
    vaultFactoryAddress: '0x3951c8992405d9668C74B13d954da79D1be46bbB',
    ethUsdPriceFeed: '0x694AA1769357215DE4FAC081bf1f309aDC325306',
  },
  421614: {
    vaultFactoryAddress: '0x333222930ff6d5f8A5127b353422f7AA905458De', // Deployed VaultFactory
    ethUsdPriceFeed: '0x2d3bBa5e0A9Fd8EAa45Dcf71A2389b7C12005b1f', // ETH/USD on Arbitrum Sepolia
  },
  97: {
    vaultFactoryAddress: '0xB025cF008CF4daE512Ec1Eff9556931021c3adEC',
    bnbUsdPriceFeed: '0x2514895c72f50D8bd4B4F9b1110F0D6bD2c97526',
  },
} as const;

export const getNetworkConfig = (chainId: number) => {
  return (NETWORK_CONFIGS as any)[chainId] || (NETWORK_CONFIGS as any)[11155111];
};

export const getVaultFactoryContract = (chainId?: number) => {
  const config = chainId ? getNetworkConfig(chainId) : (NETWORK_CONFIGS as any)[11155111];
  return {
    address: config.vaultFactoryAddress,
    abi: VaultFactoryABI,
  } as const;
};

export const getCurrentEthPrice = (chainId?: number) => {
  const config = chainId ? getNetworkConfig(chainId) : (NETWORK_CONFIGS as any)[11155111];
  const priceFeed = 'bnbUsdPriceFeed' in config ? config.bnbUsdPriceFeed : config.ethUsdPriceFeed;
  return {
    address: priceFeed,
    abi: CHAINLINK_PRICE_FEED_ABI,
  } as const;
};

export { TimeCapsuleVaultABI, VaultFactoryABI, CHAINLINK_PRICE_FEED_ABI };


