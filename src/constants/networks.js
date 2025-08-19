export const SUPPORTED_NETWORKS = [
  {
    id: 'arbitrum-sepolia',
    name: 'Arbitrum Sepolia Testnet',
    rpc: [
      'https://sepolia-rollup.arbitrum.io/rpc', // Arbitrum (primary)
      'https://arbitrum-sepolia.public.blastapi.io', // BlastAPI (fallback)
      'https://arbitrum-sepolia.drpc.me', // DRPC (fallback)
      'https://rpc.ankr.com/arbitrum_sepolia', // Ankr (last resort)
    ],
    chainId: 421614,
    currency: 'ETH',
    explorer: 'https://sepolia.arbiscan.io',
  },
]; 