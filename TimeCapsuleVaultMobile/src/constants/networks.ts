export interface SupportedNetwork {
  id: string;
  name: string;
  rpc: string[];
  chainId: number;
  currency: string;
  explorer: string;
}

export const SUPPORTED_NETWORKS: SupportedNetwork[] = [
  {
    id: 'sepolia',
    name: 'Sepolia Testnet',
    rpc: [
      process.env.EXPO_PUBLIC_SEPOLIA_RPC_URL || 'https://rpc.sepolia.org',
      'https://eth-sepolia.public.blastapi.io',
    ],
    chainId: 11155111,
    currency: 'ETH',
    explorer: 'https://sepolia.etherscan.io',
  },
  {
    id: 'arbitrum-sepolia',
    name: 'Arbitrum Sepolia',
    rpc: [
      process.env.EXPO_PUBLIC_ARBITRUM_SEPOLIA_RPC_URL || 'https://arbitrum-sepolia.public.blastapi.io',
    ],
    chainId: 421614,
    currency: 'ETH',
    explorer: 'https://sepolia.arbiscan.io',
  },
  {
    id: 'bsc-testnet',
    name: 'BSC Testnet',
    rpc: [
      process.env.EXPO_PUBLIC_BSC_TESTNET_RPC_URL || 'https://data-seed-prebsc-1-s1.binance.org:8545',
      'https://data-seed-prebsc-2-s1.binance.org:8545',
      'https://data-seed-prebsc-1-s2.binance.org:8545',
      'https://data-seed-prebsc-2-s2.binance.org:8545',
      'https://bsc-testnet.public.blastapi.io',
    ],
    chainId: 97,
    currency: 'tBNB',
    explorer: 'https://testnet.bscscan.com',
  },
];

export const getNetworkById = (id: string): SupportedNetwork | undefined =>
  SUPPORTED_NETWORKS.find((n) => n.id === id);


