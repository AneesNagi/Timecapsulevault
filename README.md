# TimeCapsule CryptoVault 🔐

> **Programmable cryptocurrency vaults with time, price, and goal-based unlocking conditions**

A secure, user-friendly DApp that enables sophisticated crypto asset management through smart contract automation. Built on Ethereum with Chainlink oracle integration.

## Project Structure

### DApp (`/`)
- **Component**: `src/components/DAppLayout.tsx`
- **Purpose**: Full DApp functionality with dashboard
- **Features**:
  - Dashboard overview (`/`)
  - Wallet management (`/wallet`)
  - Vault creation (`/create-vault`)
  - Vault management (`/my-vaults`)
  - Network selection
  - Blockchain interactions

## Key Features

### Dashboard
- 📊 Overview statistics (total vaults, wallets, ETH locked/withdrawn)
- 📈 Recent vault activity
- ⚡ Quick action buttons
- 🎨 Modern dark theme interface

### DApp Functionality
- 💼 Multi-wallet support
- 🔐 Time-locked vaults
- 💰 Price-locked vaults
- ⏰ Combined time/price conditions
- 🔄 Auto-withdrawal functionality
- 🌐 Multi-chain support

## Technology Stack

- **Frontend**: React + TypeScript
- **UI Framework**: Chakra UI
- **Animations**: Framer Motion
- **Blockchain**: Ethers.js
- **Routing**: React Router
- **State Management**: React Context + Local Storage

## Supported Networks

The TimeCapsule Vault DApp supports multiple blockchain networks:

### Ethereum Networks
- **Sepolia Testnet** (Chain ID: 11155111)
  - Primary testnet for Ethereum development
  - Full Chainlink oracle support
  - Recommended for testing

### Layer 2 Networks
- **Arbitrum Sepolia** (Chain ID: 421614)
  - Layer 2 scaling solution for Ethereum
  - Ultra-low gas fees with Ethereum security
  - Full Chainlink oracle support
  - Ideal for cost-effective testing

### BNB Smart Chain (BSC) Networks
- **BSC Testnet** (Chain ID: 97)
  - Testnet for BNB Smart Chain
  - Lower gas fees compared to Ethereum
  - BNB/USD price feed support

### Network Features
- **Multi-chain Support**: Seamlessly switch between networks
- **Network-specific Contracts**: Each network has its own deployed contracts
- **Price Feed Integration**: Chainlink oracles for accurate price data
- **Auto-withdrawal**: Automated vault unlocking across all networks

## Getting Started

1. **Install dependencies**:
```bash
npm install
```

2. **Start development server**:
```bash
npm run dev
```

3. **Access the application**:
   - Main DApp: `http://localhost:5173/`
   - Dashboard: `http://localhost:5173/dashboard`

## Deployment

### Deploy to Sepolia Testnet
```bash
npm run deploy:sepolia
```

### Deploy to Arbitrum Sepolia
```bash
npm run deploy:arbitrum-sepolia
```

### Deploy to BSC Testnet
```bash
npm run deploy:bsc-testnet
```

### Deploy to Mainnet
```bash
npm run deploy:mainnet
```

## Environment Variables

To deploy contracts, you'll need to set up the following environment variables:

### Required Variables
- `PRIVATE_KEY`: Your wallet's private key (without 0x prefix)
- `SEPOLIA_RPC_URL`: RPC URL for Sepolia testnet
- `ARBITRUM_SEPOLIA_RPC_URL`: RPC URL for Arbitrum Sepolia (optional, has default)
- `BSC_TESTNET_RPC_URL`: RPC URL for BSC testnet (optional, has default)

### API Keys for Contract Verification
- `ETHERSCAN_API_KEY`: For Sepolia and mainnet verification
- `ARBISCAN_API_KEY`: For Arbitrum Sepolia verification
- `BSCSCAN_API_KEY`: For BSC testnet verification

### Example .env file (root, used by Hardhat and Vite)
```bash
# Keys for scripts/verification
PRIVATE_KEY=your_private_key_here
SEPOLIA_RPC_URL=https://your-sepolia-rpc
ARBITRUM_SEPOLIA_RPC_URL=https://your-arb-sepolia-rpc
BSC_TESTNET_RPC_URL=https://your-bsc-testnet-rpc
ETHERSCAN_API_KEY=your_etherscan_api_key
ARBISCAN_API_KEY=your_arbiscan_api_key
BSCSCAN_API_KEY=your_bscscan_api_key

# Vite (frontend) envs
VITE_SEPOLIA_RPC_URL=https://your-sepolia-rpc
VITE_ARBITRUM_SEPOLIA_RPC_URL=https://your-arb-sepolia-rpc
VITE_BSC_TESTNET_RPC_URL=https://your-bsc-testnet-rpc
VITE_SEPOLIA_VAULT_FACTORY_ADDRESS=0x...
VITE_ARB_SEPOLIA_VAULT_FACTORY_ADDRESS=0x...
VITE_BSC_TESTNET_VAULT_FACTORY_ADDRESS=0x...
```

## Architecture Benefits

### Simplified Structure
- **Single Application**: No separation between marketing and functionality
- **Direct Access**: Users land directly in the DApp
- **Streamlined UX**: Clean, focused user experience

### Comprehensive Dashboard
- **Overview**: At-a-glance statistics and recent activity
- **Quick Actions**: Easy access to main features
- **Visual Design**: Modern dark theme with purple accents

## Routes

### Main Routes
- `/` - Dashboard (default)
- `/dashboard` - Dashboard overview
- `/my-vaults` - View and manage vaults
- `/create-vault` - Create new vault
- `/wallet` - Wallet management
- `/wallet/:address` - Individual wallet details

## Development

### Adding New Features
- **Dashboard widgets**: Update `Dashboard.tsx`
- **DApp functionality**: Update components in `src/components/`
- **Routing**: Update `App.tsx` for new routes

### Styling
- Dark theme with purple accents throughout
- Responsive design for all screen sizes
- Consistent UI patterns

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details