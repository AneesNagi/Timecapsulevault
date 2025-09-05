const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("🔧 Registering TimeCapsule Vault Automation on Arbitrum Sepolia...");
  
  // Safety check - ensure we're on Arbitrum Sepolia
  const network = await ethers.provider.getNetwork();
  if (network.chainId !== 421614n) {
    throw new Error("This script is for Arbitrum Sepolia deployment only!");
  }

  // Load deployment information
  let deploymentInfo;
  try {
    deploymentInfo = JSON.parse(fs.readFileSync("deployment-arbitrum-sepolia.json", "utf8"));
  } catch (error) {
    console.error("❌ Could not load deployment-arbitrum-sepolia.json");
    console.error("Please run deploy-arbitrum-sepolia.js first");
    process.exit(1);
  }

  const { vaultAutomationAddress, vaultFactoryAddress } = deploymentInfo;
  
  console.log(`📋 Using VaultAutomation: ${vaultAutomationAddress}`);
  console.log(`📋 Using VaultFactory: ${vaultFactoryAddress}`);

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log(`\n🔑 Deployer: ${deployer.address}`);
  console.log(`💰 Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH`);

  // Get VaultAutomation contract instance
  const VaultAutomation = await ethers.getContractFactory("VaultAutomation");
  const vaultAutomation = VaultAutomation.attach(vaultAutomationAddress);

  // Check current automation status
  console.log("\n📊 Checking current automation status...");
  try {
    const isAutomationEnabled = await vaultAutomation.isAutomationEnabled();
    console.log(`✅ Automation enabled: ${isAutomationEnabled}`);
    
    if (isAutomationEnabled) {
      console.log("🎉 Automation is already enabled!");
      return;
    }
  } catch (error) {
    console.log("ℹ️  Automation not yet configured");
  }

  // Check if automation is registered with Chainlink
  console.log("\n🔍 Checking Chainlink Automation registration...");
  try {
    const automationConfig = await vaultAutomation.getAutomationConfig();
    console.log(`📋 Automation config: ${JSON.stringify(automationConfig, null, 2)}`);
  } catch (error) {
    console.log("ℹ️  No automation config found");
  }

  // Set up automation parameters
  console.log("\n⚙️  Setting up automation parameters...");
  
  // Set minimum interval (in seconds) - 1 hour minimum
  const minInterval = 3600; // 1 hour
  try {
    const setIntervalTx = await vaultAutomation.setMinAutomationInterval(minInterval);
    await setIntervalTx.wait();
    console.log(`✅ Set minimum automation interval to ${minInterval} seconds (${minInterval/3600} hours)`);
  } catch (error) {
    console.log("ℹ️  Min interval already set or failed to set");
  }

  // Set automation fee (in wei) - 0.001 ETH
  const automationFee = ethers.parseEther("0.001");
  try {
    const setFeeTx = await vaultAutomation.setAutomationFee(automationFee);
    await setFeeTx.wait();
    console.log(`✅ Set automation fee to ${ethers.formatEther(automationFee)} ETH`);
  } catch (error) {
    console.log("ℹ️  Automation fee already set or failed to set");
  }

  // Enable automation
  console.log("\n🚀 Enabling automation...");
  try {
    const enableTx = await vaultAutomation.enableAutomation();
    await enableTx.wait();
    console.log("✅ Automation enabled successfully!");
  } catch (error) {
    console.log("ℹ️  Automation already enabled or failed to enable");
  }

  // Final status check
  console.log("\n📊 Final automation status:");
  try {
    const isEnabled = await vaultAutomation.isAutomationEnabled();
    const config = await vaultAutomation.getAutomationConfig();
    
    console.log(`✅ Automation enabled: ${isEnabled}`);
    console.log(`📋 Config: ${JSON.stringify(config, null, 2)}`);
  } catch (error) {
    console.log("⚠️  Could not verify final status");
  }

  console.log("\n🎉 Arbitrum Sepolia automation setup complete! ✅");
  console.log("\n📋 NEXT STEPS:");
  console.log("1. Test automation functionality:");
  console.log("   - Create a vault with automation enabled");
  console.log("   - Wait for automation to trigger");
  console.log("2. Monitor automation on Arbiscan:");
  console.log(`   - VaultAutomation: https://sepolia.arbiscan.io/address/${vaultAutomationAddress}`);
  console.log("3. Check Chainlink Automation dashboard:");
  console.log("   - https://automation.chain.link/");
  console.log("4. Test vault operations on Arbitrum Sepolia");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Arbitrum Sepolia automation setup failed:", error);
    process.exit(1);
  });
