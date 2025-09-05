export const SUPPORTED_NETWORKS = [
  // Only Arbitrum Sepolia
  {
    id: 'arbitrum-sepolia',
    name: 'Arbitrum Sepolia',
    rpc: [
      import.meta.env.VITE_ARBITRUM_SEPOLIA_RPC_URL || 'https://arbitrum-sepolia.public.blastapi.io',
    ],
    chainId: 421614,
    currency: 'ETH',
    explorer: 'https://sepolia.arbiscan.io',
  },
];