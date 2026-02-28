import "dotenv/config";
import express from "express";
import cors from "cors";
import { z } from "zod";
import { ethers } from "ethers";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const { ATTESTOR_PRIVATE_KEY, PORT } = process.env;
if (!ATTESTOR_PRIVATE_KEY) {
  throw new Error("Missing ATTESTOR_PRIVATE_KEY in .env");
}

const wallet = new ethers.Wallet(ATTESTOR_PRIVATE_KEY);

// Schema d'entrée
const AttestSchema = z.object({
  chainId: z.number().int().positive(),
  escrowAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  taskId: z.union([z.string(), z.number()]),
  client: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  agent: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  result: z.any(), // JSON libre
  ttlSeconds: z.number().int().positive().max(7 * 24 * 3600).default(900),
});

function computeResultHash(result) {
  // hash stable: on stringify
  const payload = JSON.stringify(result);
  return ethers.keccak256(ethers.toUtf8Bytes(payload));
}

app.get("/health", (req, res) => {
  res.json({ ok: true, attestor: wallet.address });
});

app.post("/attest", async (req, res) => {
  const parsed = AttestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: parsed.error.flatten() });
  }

  const { chainId, escrowAddress, taskId, client, agent, result, ttlSeconds } = parsed.data;

  const resultHash = computeResultHash(result);
  const validUntil = Math.floor(Date.now() / 1000) + ttlSeconds;

  // ⚠️ Doit matcher EXACTEMENT le smart contract
  const messageHash = ethers.keccak256(
    ethers.solidityPacked(
      ["string", "uint256", "address", "uint256", "address", "address", "bytes32", "uint64"],
      [
        "AGENTPAY_TASK_ATTESTATION:",
        BigInt(chainId),
        escrowAddress,
        BigInt(taskId),
        client,
        agent,
        resultHash,
        BigInt(validUntil),
      ]
    )
  );

  const signature = await wallet.signMessage(ethers.getBytes(messageHash));

  res.json({
    ok: true,
    attestor: wallet.address,
    resultHash,
    validUntil,
    signature,
  });
});

app.listen(Number(PORT || 4444), () => {
  console.log(`Attestor API listening on http://localhost:${PORT || 4444}`);
  console.log(`Attestor address: ${wallet.address}`);
});
