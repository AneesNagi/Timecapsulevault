const { Wallet } = require('ethers');

async function main() {
  // Generate a random wallet
  const wallet = Wallet.createRandom();
  
  console.log('Generated a new wallet for testing/deployment:');
  console.log('Address:', wallet.address);
  console.log('Private Key:', wallet.privateKey);
  console.log('\nWARNING: Only use this wallet for testing!');
  console.log('Fund this address with Arbitrum Sepolia ETH from a faucet like https://faucet.quicknode.com/arbitrum/sepolia');
}

main().catch(console.error); 