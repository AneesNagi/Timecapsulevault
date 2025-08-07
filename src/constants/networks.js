export const SUPPORTED_NETWORKS = [
  {
    id: 'sepolia',
    name: 'Sepolia Testnet',
    rpc: [
      'https://eth-sepolia.g.alchemy.com/v2/ekP1XVsADtC9NnTUOeltxC55HCm2BEBx', // Alchemy (primary)
      'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161', // Infura (fallback)
      'https://rpc.sepolia.org', // Public RPC (fallback)
      'https://eth-sepolia.public.blastapi.io', // BlastAPI (last resort)
    ],
    chainId: 11155111,
    currency: 'ETH',
    explorer: 'https://sepolia.etherscan.io',
  },
  {
    id: 'bsc-testnet',
    name: 'BSC Testnet',
    rpc: [
      'https://data-seed-prebsc-1-s1.binance.org:8545', // Binance (primary)
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