const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AgentRegistry", function () {
  it("agent can register and update", async function () {
    const [owner, agent, payout2] = await ethers.getSigners();

    const AgentRegistry = await ethers.getContractFactory("AgentRegistry");
    const reg = await AgentRegistry.deploy();
    await reg.waitForDeployment();

    await expect(reg.connect(agent).register("ipfs://agent/1", agent.address))
      .to.emit(reg, "AgentRegistered");

    const info1 = await reg.agents(agent.address);
    expect(info1.active).to.equal(true);
    expect(info1.payout).to.equal(agent.address);
    expect(info1.metadataURI).to.equal("ipfs://agent/1");

    await expect(reg.connect(agent).update("ipfs://agent/2", payout2.address, false))
      .to.emit(reg, "AgentUpdated");

    const info2 = await reg.agents(agent.address);
    expect(info2.active).to.equal(false);
    expect(info2.payout).to.equal(payout2.address);
    expect(info2.metadataURI).to.equal("ipfs://agent/2");
  });

  it("cannot update before register", async function () {
    const [owner, agent] = await ethers.getSigners();

    const AgentRegistry = await ethers.getContractFactory("AgentRegistry");
    const reg = await AgentRegistry.deploy();
    await reg.waitForDeployment();

    await expect(reg.connect(agent).update("x", agent.address, true))
      .to.be.revertedWithCustomError(reg, "NotAgent");
  });
});
