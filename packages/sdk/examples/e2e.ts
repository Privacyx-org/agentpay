import { ethers, NonceManager } from "ethers";
import { AgentPayClient } from "../src/index.js";

const RPC = "http://127.0.0.1:8545";

// ✅ Remplace par les adresses JSON du déploiement
const CHAIN_ID = 31337;
const ESCROW = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
const REGISTRY = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
const USDC = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

const ATTESTOR_API = "http://localhost:4444";

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC, CHAIN_ID);

  // Hardhat account #1 / #2
  const clientRaw = new ethers.Wallet(
    "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
    provider
  );
  const agentRaw = new ethers.Wallet(
    "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
    provider
  );

  // Wrap with NonceManager to avoid "nonce too low" with automining
  const client = new NonceManager(clientRaw);
  const agent = new NonceManager(agentRaw);

  const clientAddr = await client.getAddress();
  const agentAddr = await agent.getAddress();

  const sdkClient = new AgentPayClient({
    chainId: CHAIN_ID,
    provider,
    signer: client,
    escrowAddress: ESCROW as any,
    registryAddress: REGISTRY as any,
    attestorApiUrl: ATTESTOR_API,
  });

  // Mint USDC to client via direct contract call (mock)
  const usdc = new ethers.Contract(
    USDC,
    [
      "function mint(address to, uint256 amount) external",
      "function approve(address spender, uint256 value) external returns (bool)",
      "function balanceOf(address who) view returns (uint256)",
      "function decimals() view returns (uint8)"
    ],
    client
  );

  const decimals = await usdc.decimals();
  const amount = 10n * 10n ** BigInt(decimals);

  await (await usdc.mint(clientAddr, 20n * 10n ** BigInt(decimals))).wait();
  await (await usdc.approve(ESCROW, amount)).wait();

  const now = Math.floor(Date.now() / 1000);
  const deadline = now + 3600;

  const taskId = await sdkClient.createTask({
    agent: agentAddr as any,
    token: USDC as any,
    amount,
    deadline,
    metadataURI: "ipfs://sdk/e2e",
  });

  await sdkClient.fundTask(taskId);

  const attest = await sdkClient.requestAttestation({
    taskId,
    client: clientAddr as any,
    agent: agentAddr as any,
    result: { ok: true, via: "sdk" },
    ttlSeconds: 600,
  });

  // release tx can be submitted by anyone; here we submit from agent
  const sdkAgent = new AgentPayClient({
    chainId: CHAIN_ID,
    provider,
    signer: agent,
    escrowAddress: ESCROW as any,
    registryAddress: REGISTRY as any,
    attestorApiUrl: ATTESTOR_API,
  });

  await sdkAgent.releaseWithAttestation({
    taskId,
    resultHash: attest.resultHash,
    validUntil: attest.validUntil,
    signature: attest.signature,
  });

  console.log("✅ SDK E2E done, taskId:", taskId.toString());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
