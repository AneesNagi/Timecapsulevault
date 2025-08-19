const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("🔗 Registering VaultAutomation with Chainlink Automation on Arbitrum Sepolia...");

  // Load deployment info
  let deploymentInfo;
  try {
    deploymentInfo = JSON.parse(fs.readFileSync("deployment-arbitrum-sepolia.json", "utf8"));
  } catch (error) {
    console.log("⚠️  No Arbitrum Sepolia deployment found. Please run deploy-arbitrum-sepolia.js first");
    process.exit(1);
  }

  // Safety check - ensure we're on Arbitrum Sepolia
  const network = await ethers.provider.getNetwork();
  if (network.chainId !== 421614n) {
    throw new Error("This script is for Arbitrum Sepolia testnet only!");
  }

  console.log("✅ Network confirmed: Arbitrum Sepolia Testnet");
  console.log("📋 Deployment info loaded:", deploymentInfo);

  const { vaultFactory, vaultAutomation } = deploymentInfo.deployment;

  // Verify contracts are deployed
  if (!vaultFactory || !vaultAutomation) {
    throw new Error("Missing contract addresses in deployment info");
  }

  console.log("\n🔍 Verifying contract deployment...");
  
  try {
    const factory = await ethers.getContractAt("VaultFactory", vaultFactory);
    const automation = await ethers.getContractAt("VaultAutomation", vaultAutomation);
    
    console.log("✅ VaultFactory contract verified");
    console.log("✅ VaultAutomation contract verified");
    
    // Check if automation is already set
    const currentAutomation = await factory.automationContract();
    if (currentAutomation === vaultAutomation) {
      console.log("✅ Automation contract already set in factory");
    } else {
      console.log("⚠️  Automation contract not set in factory");
    }
    
  } catch (error) {
    console.error("❌ Contract verification failed:", error.message);
    process.exit(1);
  }

  console.log("\n🎯 CHAINLINK AUTOMATION REGISTRATION (ARBITRUM SEPOLIA):");
  console.log("\n📋 MANUAL REGISTRATION REQUIRED:");
  console.log("1. Visit Chainlink Automation: https://automation.chain.link/");
  console.log("2. Connect your wallet (make sure you're on Arbitrum Sepolia network)");
  console.log("3. Click 'Register New Upkeep'");
  console.log("4. Choose 'Custom Logic'");
  console.log("5. Enter the following details:");
  console.log("\n   Contract Address:");
  console.log(`   ${vaultAutomation}`);
  console.log("\n   Gas Limit:");
  console.log("   500,000 (recommended for vault operations)");
  console.log("\n   Starting Balance:");
  console.log("   0.1 ETH (minimum recommended)");
  console.log("\n   Check Data:");
  console.log("   0x (leave empty for this contract)");
  console.log("\n   Off-chain Variables:");
  console.log("   None required");
  console.log("\n   Trigger:");
  console.log("   Time-based (every 1 hour)");

  console.log("\n🔧 TECHNICAL DETAILS:");
  console.log("   Network: Arbitrum Sepolia Testnet");
  console.log("   Chain ID: 421614");
  console.log("   Automation Contract: VaultAutomation");
  console.log("   Factory Contract: VaultFactory");
  console.log("   Upkeep Function: checkUpkeep() → performUpkeep()");
  console.log("   Max Vaults per Upkeep: 20");
  console.log("   Gas Limit per Withdrawal: 100,000");

  console.log("\n💰 GET ARBITRUM SEPOLIA TESTNET TOKENS:");
  console.log("   ETH: https://faucet.quicknode.com/arbitrum/sepolia");
  console.log("   LINK: https://faucets.chain.link/arbitrum-sepolia");

  console.log("\n✅ ARBITRUM SEPOLIA ADVANTAGES:");
  console.log("   • Lower gas fees than Ethereum mainnet");
  console.log("   • Fast transaction finality");
  console.log("   • Full EVM compatibility");
  console.log("   • Chainlink oracle support");
  console.log("   • Active developer community");
  console.log("   • Reliable testnet infrastructure");

  console.log("\n🔗 USEFUL LINKS:");
  console.log("   • Arbitrum Sepolia Explorer: https://sepolia.arbiscan.io/");
  console.log("   • Arbitrum Sepolia Bridge: https://bridge.arbitrum.io/");
  console.log("   • Chainlink Automation: https://automation.chain.link/");
  console.log("   • Arbitrum Documentation: https://docs.arbitrum.io/");

  console.log("\n🎉 Arbitrum Sepolia automation registration guide completed!");
  console.log("\n📋 NEXT STEPS:");
  console.log("1. Register upkeep on Chainlink Automation");
  console.log("2. Fund the upkeep with ETH");
  console.log("3. Test vault creation and automation");
  console.log("4. Monitor upkeep performance");
  console.log("5. Scale to mainnet when ready");

  console.log("\n🔍 EXPLORER LINKS:");
  console.log("   Arbitrum Sepolia Explorer: https://sepolia.arbiscan.io/");
  console.log("   Arbitrum Sepolia Faucet: https://faucet.quicknode.com/arbitrum/sepolia");
  console.log("   Chainlink Faucet: https://faucets.chain.link/arbitrum-sepolia");

} catch (error) {
  console.error("❌ Arbitrum Sepolia automation registration failed:", error);
  process.exit(1);
}
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
