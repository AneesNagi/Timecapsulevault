const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying MockV3Aggregator Price Feed to Arbitrum Sepolia Testnet...");

  // Safety check - ensure we're on Arbitrum Sepolia
  const network = await ethers.provider.getNetwork();
  if (network.chainId !== 421614n) {
    throw new Error("This script is for Arbitrum Sepolia testnet deployment only!");
  }

  console.log("✅ Network confirmed: Arbitrum Sepolia Testnet");

  // Deploy MockV3Aggregator
  console.log("\n📊 Deploying MockV3Aggregator...");
  const MockV3Aggregator = await ethers.getContractFactory("MockV3Aggregator");
  
  // Deploy with 8 decimals and initial ETH price of $2000 (200000000000)
  const mockPriceFeed = await MockV3Aggregator.deploy(8, 200000000000);
  await mockPriceFeed.waitForDeployment();
  const mockPriceFeedAddress = await mockPriceFeed.getAddress();

  console.log("✅ MockV3Aggregator deployed to:", mockPriceFeedAddress);

  // Set a realistic ETH price (around $2000)
  console.log("\n💰 Setting initial ETH price to $2000...");
  const setPriceTx = await mockPriceFeed.updateAnswer(200000000000); // $2000 with 8 decimals
  await setPriceTx.wait();
  console.log("✅ Initial ETH price set to $2000");

  // Verify the price
  const priceData = await mockPriceFeed.latestRoundData();
  const ethPrice = Number(priceData[1]) / 100000000; // Convert from 8 decimals
  console.log("✅ Current ETH price: $", ethPrice);

  console.log("\n🎉 Mock Price Feed deployment successful! ✅");
  console.log("\n📋 DEPLOYMENT SUMMARY:");
  console.log("   Network: Arbitrum Sepolia Testnet");
  console.log("   Chain ID: 421614");
  console.log("   Mock Price Feed: https://sepolia.arbiscan.io/address/" + mockPriceFeedAddress + "#code");
  console.log("   Initial ETH Price: $2000");
  console.log("\n🚀 NEXT STEPS:");
  console.log("1. Update src/utils/contracts.ts with this address");
  console.log("2. Update TimeCapsuleVaultMobile/src/utils/contracts.ts with this address");
  console.log("3. Test vault creation with price-based conditions");
  console.log("\n📝 CONFIGURATION UPDATE:");
  console.log("   ethUsdPriceFeed: '" + mockPriceFeedAddress + "'");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Mock Price Feed deployment failed:", error);
    process.exit(1);
  });
