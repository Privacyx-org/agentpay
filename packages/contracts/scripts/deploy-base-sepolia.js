const { ethers, network } = require("hardhat");

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name} in environment`);
  }
  return value;
}

async function main() {
  if (network.name !== "baseSepolia") {
    throw new Error(`Use --network baseSepolia (current: ${network.name})`);
  }

  const treasury = required("TREASURY_ADDRESS");
  const attestor = required("ATTESTOR_ADDRESS");
  const feeBps = Number(process.env.FEE_BPS || "30");
  if (!Number.isInteger(feeBps) || feeBps < 0 || feeBps > 1000) {
    throw new Error("FEE_BPS must be an integer between 0 and 1000");
  }

  const AgentRegistry = await ethers.getContractFactory("AgentRegistry");
  const registry = await AgentRegistry.deploy();
  await registry.waitForDeployment();

  const TaskEscrow = await ethers.getContractFactory("TaskEscrow");
  const escrow = await TaskEscrow.deploy(treasury, feeBps);
  await escrow.waitForDeployment();

  await (await escrow.setAttestor(attestor)).wait();

  const out = {
    network: network.name,
    chainId: Number((await ethers.provider.getNetwork()).chainId),
    registry: await registry.getAddress(),
    escrow: await escrow.getAddress(),
    treasury,
    feeBps,
    attestor,
    deployer: (await ethers.getSigners())[0].address,
  };

  console.log(JSON.stringify(out, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
