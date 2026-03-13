const hre = require("hardhat");

async function main() {
  console.log("\n🚀 Deploying PrivacyRegistry contract...\n");

  // Get the contract factory
  const PrivacyRegistry = await hre.ethers.getContractFactory("PrivacyRegistry");
  
  // Deploy the contract
  console.log("⏳ Deployment in progress...");
  const privacyRegistry = await PrivacyRegistry.deploy();
  
  await privacyRegistry.waitForDeployment();
  
  const address = await privacyRegistry.getAddress();
  
  console.log("\n✅ PrivacyRegistry deployed to:", address);
  console.log("\n📝 Contract Details:");
  console.log("   Network:", hre.network.name);
  console.log("   Chain ID:", (await hre.ethers.provider.getNetwork()).chainId);
  console.log("\n🎉 Deployment complete!\n");
  
  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    contractAddress: address,
    deployedAt: new Date().toISOString(),
  };
  
  console.log("\n📄 Save this address for interaction:");
  console.log(JSON.stringify(deploymentInfo, null, 2));
  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
