const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("🔗 Registering VaultAutomation with Chainlink Automation on Sepolia...");
  
  // Load deployment info
  let deploymentInfo;
  try {
    deploymentInfo = JSON.parse(fs.readFileSync("deployment-sepolia.json", "utf8"));
  } catch (error) {
    console.log("⚠️  No Sepolia deployment found. Please run deploy-sepolia-automation.js first");
    return;
  }
  
  // Safety check - ensure we're on Sepolia
  const network = await ethers.provider.getNetwork();
  if (network.chainId !== 11155111n) {
    throw new Error("This script is for Sepolia testnet only!");
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
  
  console.log("\n🎯 CHAINLINK AUTOMATION REGISTRATION (SEPOLIA):");
  console.log("===============================================");
  console.log("To enable on-chain automation on Sepolia, register with Chainlink Automation:");
  console.log("");
  console.log("1. Go to https://automation.chain.link/");
  console.log("2. Connect your wallet (make sure you're on Sepolia network)");
  console.log("3. Click 'Register New Upkeep'");
  console.log("4. Select 'Custom Logic'");
  console.log("5. Enter the following details:");
  console.log("");
  console.log(`   Contract Address: ${deploymentInfo.vaultAutomationAddress}`);
  console.log("   Gas Limit: 500000");
  console.log("   Starting Balance: 0.1 LINK");
  console.log("   Check Data: 0x (empty)");
  console.log("   Trigger: 0 (time-based)");
  console.log("   Interval: 300 (5 minutes)");
  console.log("");
  console.log("6. Confirm registration");
  console.log("");
  console.log("🔗 AUTOMATION DETAILS:");
  console.log(`   Automation Contract: ${deploymentInfo.vaultAutomationAddress}`);
  console.log("   Network: Sepolia Testnet");
  console.log("   Chain ID: 11155111");
  console.log("   Function: checkUpkeep() and performUpkeep()");
  console.log("   Max Vaults per Upkeep: 20");
  console.log("   Gas Limit per Withdrawal: 100,000");
  console.log("");
  console.log("💰 GET SEPOLIA TESTNET TOKENS:");
  console.log("   ETH: https://sepoliafaucet.com/");
  console.log("   LINK: https://faucets.chain.link/sepolia");
  console.log("");
  console.log("📋 WHAT HAPPENS AFTER REGISTRATION:");
  console.log("1. Chainlink Automation nodes will call checkUpkeep() every 5 minutes");
  console.log("2. If vaults can be unlocked, performUpkeep() will execute withdrawals");
  console.log("3. Vaults will automatically unlock even if dApp is offline");
  console.log("4. No manual intervention required");
  console.log("");
  console.log("✅ SEPOLIA ADVANTAGES:");
  console.log("   🚀 Official Ethereum testnet - more reliable");
  console.log("   🔗 Better Chainlink support - more automation nodes");
  console.log("   💰 Easier token access - official faucets");
  console.log("   🛡️ More stable - fewer network issues");
  console.log("   📱 Better documentation and support");
  
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
  
  console.log("\n🎉 Sepolia automation registration guide completed!");
  console.log("Next: Register with Chainlink Automation using the details above");
  console.log("");
  console.log("🔗 USEFUL LINKS:");
  console.log("   Chainlink Automation: https://automation.chain.link/");
  console.log("   Sepolia Etherscan: https://sepolia.etherscan.io/");
  console.log("   Sepolia Faucet: https://sepoliafaucet.com/");
  console.log("   Chainlink Faucet: https://faucets.chain.link/sepolia");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Sepolia automation registration failed:", error);
    process.exit(1);
  }); 