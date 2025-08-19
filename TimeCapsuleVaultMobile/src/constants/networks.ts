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
    name: 'Arbitrum Sepolia Testnet',
    rpc: [
      'https://sepolia-rollup.arbitrum.io/rpc',
      'https://arbitrum-sepolia.public.blastapi.io',
      'https://arbitrum-sepolia.drpc.me',
      'https://rpc.ankr.com/arbitrum_sepolia',
    ],
    chainId: 421614,
    currency: 'ETH',
    explorer: 'https://sepolia.arbiscan.io',
  },
];

export const getNetworkById = (id: string): SupportedNetwork | undefined =>
  SUPPORTED_NETWORKS.find(network => network.id === id);

export const getDefaultNetwork = (): SupportedNetwork => SUPPORTED_NETWORKS[0];


