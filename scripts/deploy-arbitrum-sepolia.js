const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  try {
    console.log("🚀 Deploying TimeCapsule Vault to Arbitrum Sepolia Testnet...");

    // Safety check - ensure we're on Arbitrum Sepolia
    const network = await ethers.provider.getNetwork();
    if (network.chainId !== 421614n) {
      throw new Error("This script is for Arbitrum Sepolia testnet deployment only!");
    }

    console.log("✅ Network confirmed: Arbitrum Sepolia Testnet");

  // Load existing Arbitrum Sepolia deployment if it exists
  let existingDeployment = {};
  try {
    if (fs.existsSync("deployment-arbitrum-sepolia.json")) {
      existingDeployment = JSON.parse(fs.readFileSync("deployment-arbitrum-sepolia.json", "utf8"));
      console.log("📋 Found existing deployment:", existingDeployment);
    }
  } catch (error) {
    console.log("📋 No existing deployment found, starting fresh");
  }

      // Deploy VaultAutomation first
    console.log("\n🤖 Deploying VaultAutomation...");
    const VaultAutomation = await ethers.getContractFactory("VaultAutomation");
    const automation = await VaultAutomation.deploy(); // No constructor parameters
    await automation.waitForDeployment();
    const automationAddress = await automation.getAddress();

    console.log("✅ VaultAutomation deployed to:", automationAddress);

    // Deploy VaultFactory with automation address
    console.log("\n🏭 Deploying VaultFactory...");
    const VaultFactory = await ethers.getContractFactory("VaultFactory");
    const factory = await VaultFactory.deploy(automationAddress);
    await factory.waitForDeployment();
    const factoryAddress = await factory.getAddress();

    console.log("✅ VaultFactory deployed to:", factoryAddress);

    // Set factory contract in automation
    console.log("\n🔗 Setting factory contract in automation...");
    const setFactoryTx = await automation.setFactoryContract(factoryAddress);
    await setFactoryTx.wait();
    console.log("✅ Factory contract set in automation");

  // Save deployment info
  const deploymentInfo = {
    network: "arbitrum-sepolia",
    timestamp: new Date().toISOString(),
    contracts: {
      vaultFactory: factoryAddress,
      vaultAutomation: automationAddress,
    },
    deployment: {
      factory: factoryAddress,
      automation: automationAddress,
    }
  };

  fs.writeFileSync("deployment-arbitrum-sepolia.json", JSON.stringify(deploymentInfo, null, 2));

  console.log("\n🎉 Arbitrum Sepolia Testnet deployment successful! ✅");
  console.log("\n📋 DEPLOYMENT SUMMARY:");
  console.log("   Network: Arbitrum Sepolia Testnet");
  console.log("   Chain ID: 421614");
  console.log("   Contracts deployed:");
  console.log(`   - VaultFactory: https://sepolia.arbiscan.io/address/${factoryAddress}#code`);
  console.log(`   - VaultAutomation: https://sepolia.arbiscan.io/address/${automationAddress}#code`);
  console.log("\n🚀 NEXT STEPS:");
  console.log("1. Get Arbitrum Sepolia testnet tokens:");
  console.log("   - ETH: https://faucet.quicknode.com/arbitrum/sepolia");
  console.log("2. Test contract functionality");
  console.log("3. Register with Chainlink Automation (if needed)");
  console.log("4. Update contract addresses in src/utils/contracts.ts");
  console.log("5. Test Arbitrum Sepolia functionality");

} catch (error) {
  console.error("❌ Arbitrum Sepolia testnet deployment failed:", error);
  process.exit(1);
}
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
