import hre from "hardhat";

async function main() {
  console.log("Deploying PrivacyRegistry contract...");

  const PrivacyRegistry = await hre.ethers.getContractFactory("PrivacyRegistry");
  const privacyRegistry = await PrivacyRegistry.deploy();

  await privacyRegistry.waitForDeployment();

  const address = await privacyRegistry.getAddress();
  console.log(`PrivacyRegistry deployed to: ${address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
