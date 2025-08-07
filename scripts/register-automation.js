const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("🔗 Registering VaultAutomation with Chainlink Automation...");
  
  // Load deployment info
  const deploymentInfo = JSON.parse(fs.readFileSync("deployment-bsc-testnet.json", "utf8"));
  
  // Safety check - ensure we're on BSC testnet
  const network = await ethers.provider.getNetwork();
  if (network.chainId !== 97n) {
    throw new Error("This script is for BSC testnet deployment only!");
  }

  const [deployer] = await ethers.getSigners();
  console.log(`Registering from: ${deployer.address}`);
  
  // Get the deployed VaultAutomation contract
  const VaultAutomation = await ethers.getContractFactory("VaultAutomation");
  const vaultAutomation = VaultAutomation.attach(deploymentInfo.vaultAutomationAddress);
  
  console.log(`📋 VaultAutomation address: ${deploymentInfo.vaultAutomationAddress}`);
  console.log(`📋 VaultFactory address: ${deploymentInfo.vaultFactoryAddress}`);
  
  // Verify the contract is properly configured
  console.log("\n🔍 Verifying contract configuration...");
  
  const owner = await vaultAutomation.owner();
  const factoryContract = await vaultAutomation.factoryContract();
  
  console.log(`   Owner: ${owner}`);
  console.log(`   Factory Contract: ${factoryContract}`);
  
  if (owner !== deployer.address) {
    console.log("⚠️  Warning: You are not the owner of the VaultAutomation contract");
  }
  
  if (factoryContract !== deploymentInfo.vaultFactoryAddress) {
    console.log("⚠️  Warning: Factory contract not properly linked");
    console.log("   Linking factory contract...");
    const tx = await vaultAutomation.setFactoryContract(deploymentInfo.vaultFactoryAddress);
    await tx.wait();
    console.log("✅ Factory contract linked successfully");
  }
  
  // Check if there are any monitored vaults
  const monitoredCount = await vaultAutomation.getMonitoredVaultCount();
  console.log(`   Monitored Vaults: ${monitoredCount}`);
  
  if (monitoredCount > 0) {
    const monitoredVaults = await vaultAutomation.getMonitoredVaults();
    console.log("   Monitored Vault Addresses:");
    monitoredVaults.forEach((vault, index) => {
      console.log(`     ${index + 1}. ${vault}`);
    });
  }
  
  console.log("\n🎯 CHAINLINK AUTOMATION REGISTRATION:");
  console.log("=====================================");
  console.log("To enable on-chain automation, you need to register with Chainlink Automation:");
  console.log("");
  console.log("1. Go to https://automation.chain.link/");
  console.log("2. Connect your wallet");
  console.log("3. Click 'Register New Upkeep'");
  console.log("4. Select 'Custom Logic'");
  console.log("5. Enter the following details:");
  console.log("");
  console.log(`   Contract Address: ${deploymentInfo.vaultAutomationAddress}`);
  console.log("   Gas Limit: 500000");
  console.log("   Starting Balance: 0.1 LINK (or equivalent)");
  console.log("   Check Data: 0x (empty)");
  console.log("   Trigger: 0 (time-based)");
  console.log("   Interval: 300 (5 minutes)");
  console.log("");
  console.log("6. Confirm registration");
  console.log("");
  console.log("🔗 AUTOMATION DETAILS:");
  console.log(`   Automation Contract: ${deploymentInfo.vaultAutomationAddress}`);
  console.log("   Network: BSC Testnet");
  console.log("   Chain ID: 97");
  console.log("   Function: checkUpkeep() and performUpkeep()");
  console.log("   Max Vaults per Upkeep: 20");
  console.log("   Gas Limit per Withdrawal: 100,000");
  console.log("");
  console.log("📋 WHAT HAPPENS AFTER REGISTRATION:");
  console.log("1. Chainlink Automation nodes will call checkUpkeep() every 5 minutes");
  console.log("2. If vaults can be unlocked, performUpkeep() will execute withdrawals");
  console.log("3. Vaults will automatically unlock even if dApp is offline");
  console.log("4. No manual intervention required");
  console.log("");
  console.log("✅ AUTOMATION BENEFITS:");
  console.log("   🚀 True autonomy - vaults unlock automatically");
  console.log("   🛡️ Decentralized - no single point of failure");
  console.log("   ⚡ Efficient - batch processing of multiple vaults");
  console.log("   🔒 Secure - on-chain execution with gas limits");
  console.log("   📱 Offline-proof - works even when dApp is down");
  
  // Test the automation contract
  console.log("\n🧪 Testing automation contract...");
  try {
    const [upkeepNeeded, performData] = await vaultAutomation.checkUpkeep("0x");
    console.log(`   Upkeep Needed: ${upkeepNeeded}`);
    console.log(`   Perform Data: ${performData}`);
    
    if (upkeepNeeded) {
      console.log("   ✅ Automation is working - vaults can be unlocked!");
    } else {
      console.log("   ℹ️  No vaults ready for withdrawal at the moment");
    }
  } catch (error) {
    console.log("   ⚠️  Error testing automation:", error.message);
  }
  
  console.log("\n🎉 Automation registration guide completed!");
  console.log("Next: Register with Chainlink Automation using the details above");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Automation registration failed:", error);
    process.exit(1);
  }); 