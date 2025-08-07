# BSC Testnet Deployment Guide

This guide covers deploying and using the TimeCapsule Vault DApp on BNB Smart Chain (BSC) testnet.

## Prerequisites

1. **BSC Testnet BNB**: Get test BNB from the [BSC Testnet Faucet](https://testnet.binance.org/faucet-smart)
2. **Private Key**: Have a wallet with test BNB for deployment
3. **Environment Variables**: Set up your `.env` file

## Environment Setup

Add the following to your `.env` file:

```env
# BSC Testnet Configuration
BSC_TESTNET_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545
BSCSCAN_API_KEY=your_bscscan_api_key_here
PRIVATE_KEY=your_wallet_private_key_here
```

## Deployment

### 1. Compile Contracts
```bash
npm run compile
```

### 2. Deploy to BSC Testnet
```bash
npm run deploy:bsc-testnet
```

### 3. Verify Contracts (Optional)
```bash
npm run verify:bsc-testnet
```

## Contract Addresses

After deployment, update the contract addresses in `src/utils/contracts.ts`:

```typescript
// BSC testnet
97: {
  vaultFactoryAddress: 'YOUR_DEPLOYED_FACTORY_ADDRESS' as const,
  bnbUsdPriceFeed: '0x2514895c72f50D8bd4B4F9b1110F0D6bD2c97526' as const, // BNB/USD
},
```

## BSC Testnet Features

### Network Information
- **Chain ID**: 97
- **Currency**: tBNB (Test BNB)
- **Block Time**: ~3 seconds
- **Gas Fees**: Much lower than Ethereum

### Price Feeds
- **BNB/USD**: `0x2514895c72f50D8bd4B4F9b1110F0D6bD2c97526`
- **Supported**: Price-locked vaults with BNB price targets

### Limitations
- **Chainlink Automation**: May not be available on BSC testnet
- **Oracle Coverage**: Limited compared to Ethereum mainnet
- **Testing Focus**: Primarily for testing vault functionality

## Testing on BSC Testnet

### 1. Get Test BNB
Visit the [BSC Testnet Faucet](https://testnet.binance.org/faucet-smart) to get test BNB.

### 2. Create Test Wallet
Use the wallet manager in the DApp to create a new wallet for BSC testnet.

### 3. Test Vault Creation
- Create time-locked vaults
- Create price-locked vaults (BNB/USD)
- Test deposits and withdrawals

### 4. Monitor Transactions
Use [BSCScan Testnet](https://testnet.bscscan.com/) to monitor your transactions.

## Troubleshooting

### Common Issues

1. **"Contract not deployed" error**
   - Ensure you've deployed to BSC testnet
   - Check contract addresses in `src/utils/contracts.ts`

2. **"Insufficient gas" errors**
   - BSC testnet may have different gas requirements
   - Try increasing gas limit in transactions

3. **Price feed issues**
   - Verify BNB/USD price feed address
   - Check if price feed is responding

### RPC Endpoints

If the primary RPC fails, the DApp will automatically try these fallback endpoints:
- `https://data-seed-prebsc-2-s1.binance.org:8545`
- `https://data-seed-prebsc-1-s2.binance.org:8545`
- `https://data-seed-prebsc-2-s2.binance.org:8545`
- `https://bsc-testnet.public.blastapi.io`

## Migration from Sepolia

If you're migrating from Sepolia testnet:

1. **Update Network Selection**: Use the network selector in the DApp
2. **Create New Wallets**: Wallets are network-specific
3. **Deploy Contracts**: Contracts must be deployed separately for each network
4. **Test Functionality**: Verify all features work on BSC testnet

## Next Steps

After successful BSC testnet deployment:

1. **Test All Features**: Ensure vault creation, deposits, and withdrawals work
2. **Update Documentation**: Update contract addresses in your documentation
3. **Consider Mainnet**: Plan for BSC mainnet deployment if needed
4. **Monitor Performance**: Track gas usage and transaction success rates 