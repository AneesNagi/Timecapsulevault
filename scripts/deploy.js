// Deployment script that links VaultAutomation and VaultFactory
const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  const providerNetwork = await ethers.provider.getNetwork();
  console.log(`Deploying contracts to chainId: ${providerNetwork.chainId}`);

  const [deployer] = await ethers.getSigners();
  console.log(`Deployer: ${deployer.address}`);

  // Deploy VaultAutomation
  const VaultAutomation = await ethers.getContractFactory("VaultAutomation");
  const vaultAutomation = await VaultAutomation.deploy();
  await vaultAutomation.waitForDeployment();
  const automationAddress = await vaultAutomation.getAddress();
  console.log(`VaultAutomation deployed: ${automationAddress}`);

  // Deploy VaultFactory with automation address
  const VaultFactory = await ethers.getContractFactory("VaultFactory");
  const vaultFactory = await VaultFactory.deploy(automationAddress);
  await vaultFactory.waitForDeployment();
  const factoryAddress = await vaultFactory.getAddress();
  console.log(`VaultFactory deployed: ${factoryAddress}`);

  // Link factory in automation
  const tx = await vaultAutomation.setFactoryContract(factoryAddress);
  await tx.wait();
  console.log(`Linked factory in automation.`);

  // Save deployment
  const deploymentInfo = {
    chainId: Number(providerNetwork.chainId),
    vaultFactoryAddress: factoryAddress,
    vaultAutomationAddress: automationAddress,
    deployer: deployer.address,
    timestamp: new Date().toISOString()
  };
  fs.writeFileSync("deployment.json", JSON.stringify(deploymentInfo, null, 2));

  console.log("\nDeployment successful! ✅");
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exit(1);
});
