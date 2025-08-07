const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("🚀 Deploying TimeCapsule Vault to BSC Testnet...");
  
  // Safety check - ensure we're on BSC testnet
  const network = await ethers.provider.getNetwork();
  if (network.chainId !== 97n) {
    throw new Error("This script is for BSC testnet deployment only!");
  }

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying from: ${deployer.address}`);
  console.log(`Account balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} tBNB`);

  // Deploy VaultAutomation first
  console.log("\n📋 Deploying VaultAutomation contract...");
  const VaultAutomation = await ethers.getContractFactory("VaultAutomation");
  const vaultAutomation = await VaultAutomation.deploy();
  await vaultAutomation.waitForDeployment();
  const automationAddress = await vaultAutomation.getAddress();
  console.log(`✅ VaultAutomation deployed to: ${automationAddress}`);

  // Deploy VaultFactory with automation address
  console.log("\n📋 Deploying VaultFactory contract...");
  const VaultFactory = await ethers.getContractFactory("VaultFactory");
  const vaultFactory = await VaultFactory.deploy(automationAddress);
  await vaultFactory.waitForDeployment();
  const factoryAddress = await vaultFactory.getAddress();
  console.log(`✅ VaultFactory deployed to: ${factoryAddress}`);

  // Set factory contract in automation
  console.log("\n🔗 Linking VaultFactory to VaultAutomation...");
  const setFactoryTx = await vaultAutomation.setFactoryContract(factoryAddress);
  await setFactoryTx.wait();
  console.log("✅ Factory contract linked to automation");

  // Save deployment information
  const deploymentInfo = {
    network: "bsc-testnet",
    chainId: 97,
    vaultFactoryAddress: factoryAddress,
    vaultAutomationAddress: automationAddress,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber(),
    gasUsed: {
      automation: (await vaultAutomation.deploymentTransaction()).gasLimit.toString(),
      factory: (await vaultFactory.deploymentTransaction()).gasLimit.toString()
    }
  };

  fs.writeFileSync(
    "deployment-bsc-testnet.json",
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\n🎉 BSC Testnet deployment successful! ✅");
  console.log("\n📋 DEPLOYMENT SUMMARY:");
  console.log(`   VaultFactory: ${factoryAddress}`);
  console.log(`   VaultAutomation: ${automationAddress}`);
  console.log(`   Deployer: ${deployer.address}`);
  console.log(`   Block: ${deploymentInfo.blockNumber}`);
  
  console.log("\n🔗 NEXT STEPS:");
  console.log("1. Verify contracts on BSCScan:");
  console.log(`   - VaultFactory: https://testnet.bscscan.com/address/${factoryAddress}#code`);
  console.log(`   - VaultAutomation: https://testnet.bscscan.com/address/${automationAddress}#code`);
  console.log("2. Register with Chainlink Automation (if available on BSC):");
  console.log("   - Go to https://automation.chain.link/");
  console.log(`   - Register upkeep with address: ${automationAddress}`);
  console.log("3. Update frontend configuration:");
  console.log(`   - Update BSC testnet contract addresses in src/utils/contracts.ts`);
  console.log("4. Test BSC testnet functionality");
  console.log("5. Get test BNB from faucet if needed");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ BSC testnet deployment failed:", error);
    process.exit(1);
  }); 