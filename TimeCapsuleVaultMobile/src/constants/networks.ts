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
    id: 'arbitrum-sepolia',
    name: 'Arbitrum Sepolia',
    rpc: [
      process.env.EXPO_PUBLIC_ARBITRUM_SEPOLIA_RPC_URL || 'https://arbitrum-sepolia.public.blastapi.io',
    ],
    chainId: 421614,
    currency: 'ETH',
    explorer: 'https://sepolia.arbiscan.io',
  },
];

export const getNetworkById = (id: string): SupportedNetwork | undefined =>
  SUPPORTED_NETWORKS.find((n) => n.id === id);


