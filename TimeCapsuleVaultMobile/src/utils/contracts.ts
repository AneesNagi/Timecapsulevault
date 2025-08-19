import { TimeCapsuleVaultABI, VaultFactoryABI, CHAINLINK_PRICE_FEED_ABI } from '../contracts/abis';

const NETWORK_CONFIGS = {
  421614: {
    vaultFactoryAddress: '0x3994B729338b083E50ea0c68364c7030D2Db398A', // Deployed VaultFactory
    ethUsdPriceFeed: '0x3951c8992405d9668C74B13d954da79D1be46bbB', // MockV3Aggregator Price Feed
  },
} as const;

export const getNetworkConfig = (chainId: number) => {
  return (NETWORK_CONFIGS as any)[chainId] || (NETWORK_CONFIGS as any)[421614];
};

export const getVaultFactoryContract = (chainId?: number) =>
  getNetworkConfig(chainId || 421614).vaultFactoryAddress;

export const getPriceFeedContract = (chainId?: number) =>
  getNetworkConfig(chainId || 421614).ethUsdPriceFeed;

export { TimeCapsuleVaultABI, VaultFactoryABI, CHAINLINK_PRICE_FEED_ABI };


