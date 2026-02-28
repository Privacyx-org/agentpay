const { ethers } = require("hardhat");
const API_ATTESTOR = "0xf404073fB549f51D440d944F77815845Ac92E125";

async function main() {
  const [deployer, treasury] = await ethers.getSigners();

  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const usdc = await MockUSDC.deploy();
  await usdc.waitForDeployment();

  const AgentRegistry = await ethers.getContractFactory("AgentRegistry");
  const registry = await AgentRegistry.deploy();
  await registry.waitForDeployment();

  const TaskEscrow = await ethers.getContractFactory("TaskEscrow");
  const escrow = await TaskEscrow.deploy(treasury.address, 30);
  await escrow.waitForDeployment();

  await (await escrow.setAttestor(API_ATTESTOR)).wait();

  console.log(JSON.stringify({
    chainId: Number((await ethers.provider.getNetwork()).chainId),
    rpcUrl: "http://127.0.0.1:8545",
    usdc: await usdc.getAddress(),
    registry: await registry.getAddress(),
    escrow: await escrow.getAddress(),
    attestor: API_ATTESTOR
  }, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
