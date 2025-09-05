const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("🚀 Deploying TimeCapsule Vault Automation to Sepolia Testnet...");
  
  // Safety check - ensure we're on Sepolia
  const network = await ethers.provider.getNetwork();
  if (network.chainId !== 11155111n) {
    throw new Error("This script is for Sepolia testnet deployment only!");
  }

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying from: ${deployer.address}`);
  console.log(`Account balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH`);

  // Load existing Sepolia deployment
  let deploymentInfo;
  try {
    deploymentInfo = JSON.parse(fs.readFileSync("deployment.json", "utf8"));
    console.log(`📋 Existing VaultFactory: ${deploymentInfo.vaultFactoryAddress}`);
  } catch (error) {
    console.log("⚠️  No existing deployment found, will deploy both contracts");
  }

  // Deploy VaultAutomation first
  console.log("\n📋 Deploying VaultAutomation contract...");
  const VaultAutomation = await ethers.getContractFactory("VaultAutomation");
  const vaultAutomation = await VaultAutomation.deploy();
  await vaultAutomation.waitForDeployment();
  const automationAddress = await vaultAutomation.getAddress();
  console.log(`✅ VaultAutomation deployed to: ${automationAddress}`);

  // Deploy VaultFactory if not exists, or use existing
  let factoryAddress;
  if (!deploymentInfo || !deploymentInfo.vaultFactoryAddress) {
    console.log("\n📋 Deploying VaultFactory contract...");
    const VaultFactory = await ethers.getContractFactory("VaultFactory");
    const vaultFactory = await VaultFactory.deploy(automationAddress);
    await vaultFactory.waitForDeployment();
    factoryAddress = await vaultFactory.getAddress();
    console.log(`✅ VaultFactory deployed to: ${factoryAddress}`);
  } else {
    factoryAddress = deploymentInfo.vaultFactoryAddress;
    console.log(`📋 Using existing VaultFactory: ${factoryAddress}`);
  }

  // Set factory contract in automation
  console.log("\n🔗 Linking VaultFactory to VaultAutomation...");
  const setFactoryTx = await vaultAutomation.setFactoryContract(factoryAddress);
  await setFactoryTx.wait();
  console.log("✅ Factory contract linked to automation");

  // Save deployment information
  const newDeploymentInfo = {
    network: "sepolia",
    chainId: 11155111,
    vaultFactoryAddress: factoryAddress,
    vaultAutomationAddress: automationAddress,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber(),
    gasUsed: {
      automation: (await vaultAutomation.deploymentTransaction()).gasLimit.toString(),
      factory: deploymentInfo ? "existing" : (await vaultFactory.deploymentTransaction()).gasLimit.toString()
    }
  };

  fs.writeFileSync(
    "deployment-sepolia.json",
    JSON.stringify(newDeploymentInfo, null, 2)
  );

  console.log("\n🎉 Sepolia Testnet deployment successful! ✅");
  console.log("\n📋 DEPLOYMENT SUMMARY:");
  console.log(`   VaultFactory: ${factoryAddress}`);
  console.log(`   VaultAutomation: ${automationAddress}`);
  console.log(`   Deployer: ${deployer.address}`);
  console.log(`   Block: ${newDeploymentInfo.blockNumber}`);
  
  console.log("\n🔗 NEXT STEPS:");
  console.log("1. Verify contracts on Etherscan:");
  console.log(`   - VaultFactory: https://sepolia.etherscan.io/address/${factoryAddress}#code`);
  console.log(`   - VaultAutomation: https://sepolia.etherscan.io/address/${automationAddress}#code`);
  console.log("2. Get Sepolia testnet tokens:");
  console.log("   - ETH: https://sepoliafaucet.com/");
  console.log("   - LINK: https://faucets.chain.link/sepolia");
  console.log("3. Register with Chainlink Automation:");
  console.log("   - Go to https://automation.chain.link/");
  console.log(`   - Register upkeep with address: ${automationAddress}`);
  console.log("4. Update frontend configuration:");
  console.log(`   - Update Sepolia contract addresses in src/utils/contracts.ts`);
  console.log("5. Test Sepolia functionality");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Sepolia testnet deployment failed:", error);
    process.exit(1);
  }); 