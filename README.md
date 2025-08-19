# TimeCapsule CryptoVault 🔐

> **Programmable cryptocurrency vaults with time, price, and goal-based unlocking conditions**

A secure, user-friendly DApp that enables sophisticated crypto asset management through smart contract automation. Built on Arbitrum with Chainlink oracle integration.

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

The TimeCapsule Vault DApp supports the following blockchain network:

### Arbitrum Networks
- **Arbitrum Sepolia Testnet** (Chain ID: 421614)
  - Primary testnet for Arbitrum development
  - Full Chainlink oracle support
  - Lower gas fees compared to Ethereum
  - Recommended for testing

### Network Features
- **Multi-chain Support**: Seamlessly switch between networks
- **Network-specific Contracts**: Each network has its own deployed contracts
- **Price Feed Integration**: Chainlink oracles for accurate price data
- **Auto-withdrawal**: Automated vault unlocking across all networks

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- MetaMask or compatible wallet
- Arbitrum Sepolia testnet ETH

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd Timecapsulevault

# Install dependencies
npm install

# Start development server
npm run dev
```

### Deploy to Arbitrum Sepolia Testnet
```bash
# Set your private key in .env file
echo "PRIVATE_KEY=your_private_key_here" >> .env
echo "ARBITRUM_SEPOLIA_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc" >> .env

# Deploy contracts
npm run deploy:arbitrum-sepolia

# Verify contracts (optional)
npm run verify:arbitrum-sepolia
```

### Get Testnet Tokens
- **ETH**: https://faucet.quicknode.com/arbitrum/sepolia
- **LINK**: https://faucets.chain.link/arbitrum-sepolia

## Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run deploy:arbitrum-sepolia` - Deploy to Arbitrum Sepolia
- `npm run verify:arbitrum-sepolia` - Verify contracts on Arbiscan
- `npm run test` - Run tests
- `npm run compile` - Compile smart contracts

### Contract Verification
After deployment, verify your contracts on Arbiscan:
```bash
npm run verify:arbitrum-sepolia
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.