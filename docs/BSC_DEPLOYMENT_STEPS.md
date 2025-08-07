# BSC Testnet Deployment Steps

## Prerequisites

1. **Get BSC Testnet BNB**: Visit [BSC Testnet Faucet](https://testnet.binance.org/faucet-smart)
2. **Create .env file** with the following variables:

```env
# BSC Testnet Configuration
BSC_TESTNET_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545
BSCSCAN_API_KEY=your_bscscan_api_key_here
PRIVATE_KEY=your_wallet_private_key_here
```

## Step 1: Compile Contracts

```bash
npm run compile
```

## Step 2: Deploy to BSC Testnet

```bash
npm run deploy:bsc-testnet
```

## Step 3: Update Contract Addresses

After successful deployment, update the contract addresses in `src/utils/contracts.ts`:

```typescript
// BSC testnet
97: {
  vaultFactoryAddress: 'YOUR_DEPLOYED_FACTORY_ADDRESS' as const,
  bnbUsdPriceFeed: '0x2514895c72f50D8bd4B4F9b1110F0D6bD2c97526' as const, // BNB/USD
},
```

## Step 4: Verify Contracts (Optional)

```bash
npm run verify:bsc-testnet
```

## Step 5: Test the DApp

1. Start the development server: `npm run dev`
2. Switch to BSC Testnet in the network selector
3. Create a wallet and get test BNB from faucet
4. Test vault creation and functionality 