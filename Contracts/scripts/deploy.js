/* eslint-disable no-console */
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const CredAura = await hre.ethers.getContractFactory("CredAura");
  const credAura = await CredAura.deploy();
  await credAura.waitForDeployment();

  const address = await credAura.getAddress();
  console.log("CredAura deployed to:", address);
  console.log("Owner (backend signer must match for release/liquidate):", deployer.address);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
