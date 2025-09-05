export const SUPPORTED_NETWORKS = [
  {
    id: 'sepolia',
    name: 'Sepolia Testnet',
    rpc: [
      import.meta.env.VITE_SEPOLIA_RPC_URL || 'https://rpc.sepolia.org',
      'https://rpc.sepolia.org', // Public RPC (fallback)
      'https://eth-sepolia.public.blastapi.io', // BlastAPI (last resort)
    ],
    chainId: 11155111,
    currency: 'ETH',
    explorer: 'https://sepolia.etherscan.io',
  },
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
  {
    id: 'bsc-testnet',
    name: 'BSC Testnet',
    rpc: [
      import.meta.env.VITE_BSC_TESTNET_RPC_URL || 'https://data-seed-prebsc-1-s1.binance.org:8545',
      'https://data-seed-prebsc-2-s1.binance.org:8545', // Binance (fallback)
      'https://data-seed-prebsc-1-s2.binance.org:8545', // Binance (fallback)
      'https://data-seed-prebsc-2-s2.binance.org:8545', // Binance (fallback)
      'https://bsc-testnet.public.blastapi.io', // BlastAPI (last resort)
    ],
    chainId: 97,
    currency: 'tBNB',
    explorer: 'https://testnet.bscscan.com',
  },
]; 