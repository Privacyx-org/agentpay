const { ethers, network } = require("hardhat");

async function main() {
  if (network.name !== "baseSepolia") {
    throw new Error(`Use --network baseSepolia (current: ${network.name})`);
  }

  const [deployer] = await ethers.getSigners();
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const usdc = await MockUSDC.deploy();
  await usdc.waitForDeployment();

  console.log(
    JSON.stringify(
      {
        network: "baseSepolia",
        chainId: Number((await ethers.provider.getNetwork()).chainId),
        mockUSDC: await usdc.getAddress(),
        deployer: deployer.address,
      },
      null,
      2
    )
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
