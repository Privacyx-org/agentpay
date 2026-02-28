const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TaskEscrow", function () {
  async function deploy() {
    const [owner, client, agent, treasury] = await ethers.getSigners();

    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const usdc = await MockUSDC.deploy();
    await usdc.waitForDeployment();

    // feeBps = 30 => 0.30%
    const TaskEscrow = await ethers.getContractFactory("TaskEscrow");
    const escrow = await TaskEscrow.deploy(treasury.address, 30);
    await escrow.waitForDeployment();

    return { owner, client, agent, treasury, usdc, escrow };
  }

  it("create -> fund -> release distributes fee + payout", async function () {
    const { client, agent, treasury, usdc, escrow } = await deploy();

    // Mint 100 USDC to client (6 decimals)
    await usdc.mint(client.address, 100n * 10n ** 6n);

    const now = (await ethers.provider.getBlock("latest")).timestamp;
    const deadline = now + 3600;

    // Create task for 50 USDC
    const amount = 50n * 10n ** 6n;
    const tx = await escrow
      .connect(client)
      .createTask(agent.address, await usdc.getAddress(), amount, deadline, "ipfs://task/1");
    const rc = await tx.wait();
    const taskId = rc.logs.find((l) => l.fragment?.name === "TaskCreated").args.taskId;

    // Approve + fund
    await usdc.connect(client).approve(await escrow.getAddress(), amount);
    await expect(escrow.connect(client).fundTask(taskId)).to.emit(escrow, "TaskFunded");

    // Release
    const treasuryBefore = await usdc.balanceOf(treasury.address);
    const agentBefore = await usdc.balanceOf(agent.address);

    await expect(escrow.connect(client).release(taskId)).to.emit(escrow, "TaskReleased");

    const treasuryAfter = await usdc.balanceOf(treasury.address);
    const agentAfter = await usdc.balanceOf(agent.address);

    const fee = (amount * 30n) / 10000n; // 0.30%
    const payout = amount - fee;

    expect(treasuryAfter - treasuryBefore).to.equal(fee);
    expect(agentAfter - agentBefore).to.equal(payout);
  });

  it("refund only after deadline", async function () {
    const { client, agent, usdc, escrow } = await deploy();

    await usdc.mint(client.address, 10n * 10n ** 6n);

    const now = (await ethers.provider.getBlock("latest")).timestamp;
    const deadline = now + 120; // 2 minutes (safe margin)
    const amount = 5n * 10n ** 6n;

    const tx = await escrow
      .connect(client)
      .createTask(agent.address, await usdc.getAddress(), amount, deadline, "ipfs://task/2");
    const rc = await tx.wait();
    const taskId = rc.logs.find((l) => l.fragment?.name === "TaskCreated").args.taskId;

    await usdc.connect(client).approve(await escrow.getAddress(), amount);
    await escrow.connect(client).fundTask(taskId);

    // Too early
    await expect(escrow.connect(client).refund(taskId)).to.be.revertedWithCustomError(
      escrow,
      "DeadlineNotPassed"
    );

    // Advance time past deadline
    await ethers.provider.send("evm_increaseTime", [130]);
    await ethers.provider.send("evm_mine");

    await expect(escrow.connect(client).refund(taskId)).to.emit(escrow, "TaskRefunded");
  });

  it("only client can fund/release/refund", async function () {
    const { client, agent, usdc, escrow } = await deploy();

    await usdc.mint(client.address, 10n * 10n ** 6n);

    const now = (await ethers.provider.getBlock("latest")).timestamp;
    const deadline = now + 3600;
    const amount = 5n * 10n ** 6n;

    const tx = await escrow
      .connect(client)
      .createTask(agent.address, await usdc.getAddress(), amount, deadline, "ipfs://task/3");
    const rc = await tx.wait();
    const taskId = rc.logs.find((l) => l.fragment?.name === "TaskCreated").args.taskId;

    await usdc.connect(client).approve(await escrow.getAddress(), amount);

    await expect(escrow.connect(agent).fundTask(taskId)).to.be.revertedWithCustomError(escrow, "NotClient");
    await escrow.connect(client).fundTask(taskId);

    await expect(escrow.connect(agent).release(taskId)).to.be.revertedWithCustomError(escrow, "NotClient");
  });

  it("releaseWithAttestation works with valid signature", async function () {
    const { owner, client, agent, treasury, usdc, escrow } = await deploy();

    // set attestor = owner (déjà le cas par défaut, mais clair)
    await escrow.connect(owner).setAttestor(owner.address);

    await usdc.mint(client.address, 20n * 10n ** 6n);

    const now = (await ethers.provider.getBlock("latest")).timestamp;
    const deadline = now + 3600;
    const amount = 10n * 10n ** 6n;

    const tx = await escrow
      .connect(client)
      .createTask(agent.address, await usdc.getAddress(), amount, deadline, "ipfs://task/attest");
    const rc = await tx.wait();
    const taskId = rc.logs.find((l) => l.fragment?.name === "TaskCreated").args.taskId;

    await usdc.connect(client).approve(await escrow.getAddress(), amount);
    await escrow.connect(client).fundTask(taskId);

    const resultHash = ethers.keccak256(ethers.toUtf8Bytes("result:ok"));
    const validUntil = BigInt(now + 600);

    const digest = ethers.keccak256(
      ethers.solidityPacked(
        ["string","uint256","address","uint256","address","address","bytes32","uint64"],
        ["AGENTPAY_TASK_ATTESTATION:", await ethers.provider.getNetwork().then(n=>n.chainId), await escrow.getAddress(), taskId, client.address, agent.address, resultHash, validUntil]
      )
    );

    const sig = await owner.signMessage(ethers.getBytes(digest));

    await expect(
      escrow.connect(agent).releaseWithAttestation(taskId, resultHash, validUntil, sig)
    ).to.emit(escrow, "TaskReleasedWithAttestation");
  });
});
