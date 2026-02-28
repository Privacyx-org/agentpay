const { ethers } = require("hardhat");

async function main() {
  const [deployer, client, agent, treasury] = await ethers.getSigners();

  // Deploy MockUSDC
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const usdc = await MockUSDC.deploy();
  await usdc.waitForDeployment();

  // Deploy TaskEscrow (fee 30 bps)
  const TaskEscrow = await ethers.getContractFactory("TaskEscrow");
  const escrow = await TaskEscrow.deploy(treasury.address, 30);
  await escrow.waitForDeployment();

  const usdcAddr = await usdc.getAddress();
  const escrowAddr = await escrow.getAddress();

  console.log("MockUSDC:", usdcAddr);
  console.log("TaskEscrow:", escrowAddr);
  console.log("client:", client.address);
  console.log("agent:", agent.address);
  console.log("treasury:", treasury.address);

  // Set attestor = API attestor address
  const attestor = "0xf404073fB549f51D440d944F77815845Ac92E125";
  await (await escrow.connect(deployer).setAttestor(attestor)).wait();
  console.log("attestor set to:", attestor);

  // Mint and create task
  await (await usdc.mint(client.address, 20n * 10n ** 6n)).wait();

  const now = (await ethers.provider.getBlock("latest")).timestamp;
  const deadline = now + 3600;
  const amount = 10n * 10n ** 6n;

  const tx = await escrow
    .connect(client)
    .createTask(agent.address, usdcAddr, amount, deadline, "ipfs://task/e2e");
  const rc = await tx.wait();
  const taskId = rc.logs.find((l) => l.fragment?.name === "TaskCreated").args.taskId;

  console.log("taskId:", taskId.toString());

  await (await usdc.connect(client).approve(escrowAddr, amount)).wait();
  await (await escrow.connect(client).fundTask(taskId)).wait();
  console.log("funded");

  // Call attestor API
  const chainId = (await ethers.provider.getNetwork()).chainId;

  const body = {
    chainId: Number(chainId),
    escrowAddress: escrowAddr,
    taskId: taskId.toString(),
    client: client.address,
    agent: agent.address,
    result: { ok: true, note: "e2e local" },
    ttlSeconds: 900,
  };

  const res = await fetch("http://localhost:4444/attest", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  const json = await res.json();
  if (!json.ok) throw new Error("Attest failed: " + JSON.stringify(json));

  console.log("attestation:", json);

  // Release with attestation (anyone can submit)
  const resultHash = json.resultHash;
  const validUntil = json.validUntil;
  const signature = json.signature;

  const treasuryBefore = await usdc.balanceOf(treasury.address);
  const agentBefore = await usdc.balanceOf(agent.address);

  await (await escrow.connect(agent).releaseWithAttestation(taskId, resultHash, validUntil, signature)).wait();
  console.log("released with attestation");

  const treasuryAfter = await usdc.balanceOf(treasury.address);
  const agentAfter = await usdc.balanceOf(agent.address);

  console.log("treasury delta:", (treasuryAfter - treasuryBefore).toString());
  console.log("agent delta:", (agentAfter - agentBefore).toString());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
