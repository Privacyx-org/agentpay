# railent-sdk

Railent SDK - payment rails for autonomous agents.

`railent-sdk` provides simple primitives to interact with Railent contracts:

- Register agent
- Create task
- Fund task
- Release task with attestation

## Install

```bash
npm install railent-sdk ethers
```

## Quickstart (functional API)

```ts
import { ethers } from "ethers";
import {
  registerAgent,
  createTask,
  fundTask,
  releaseWithAttestation,
} from "railent-sdk";

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const signer = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

const registryAddress = "0x..." as const;
const escrowAddress = "0x..." as const;

await registerAgent({
  registryAddress,
  signer,
  metadataURI: "ipfs://agent/metadata.json",
  payoutAddress: "0x...",
});

const taskId = await createTask({
  escrowAddress,
  signer,
  agent: "0x...",
  token: "0x...",
  amount: ethers.parseUnits("10", 6),
  deadline: Math.floor(Date.now() / 1000) + 3600,
  metadataURI: "ipfs://task/metadata.json",
});

await fundTask({ escrowAddress, signer, taskId });

await releaseWithAttestation({
  escrowAddress,
  signer,
  taskId,
  resultHash: "0x...",
  validUntil: Math.floor(Date.now() / 1000) + 600,
  signature: "0x...",
});
```

## Client API

You can also use `AgentPayClient`.

```ts
import { AgentPayClient } from "railent-sdk";

const sdk = new AgentPayClient({
  chainId: 84532,
  provider,
  signer,
  escrowAddress: "0x...",
  registryAddress: "0x...",
  attestorApiUrl: "https://your-attestor-api.example.com",
});

await sdk.registerAgent("ipfs://agent/metadata.json", "0x...");
const taskId = await sdk.createTask({
  agent: "0x...",
  token: "0x...",
  amount: 1_000_000n,
  deadline: Math.floor(Date.now() / 1000) + 3600,
  metadataURI: "ipfs://task/metadata.json",
});
await sdk.fundTask(taskId);
```

## Exports

- `registerAgent(params)`
- `createTask(params)`
- `fundTask(params)`
- `releaseWithAttestation(params)`
- `releaseTask(params)` (alias of `releaseWithAttestation`)
- `AgentPayClient`
- all SDK types from `types.ts`

## Types

Main types include:

- `RegisterAgentParams`
- `CreateTaskParams`
- `FundTaskParams`
- `ReleaseWithAttestationParams`
- `AgentPayConfig`
- `AttestationResponse`

## Notes

- `createTask` includes a fallback on `nextTaskId - 1` if event parsing fails on some providers.
- `releaseWithAttestation` requires `validUntil` and `signature` from your attestor.
- Railent is currently focused on testnet flows (Base Sepolia).

## License

MIT
