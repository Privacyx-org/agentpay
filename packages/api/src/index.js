import "dotenv/config";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { ethers } from "ethers";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

const mintLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
});

const MINT_COOLDOWN_SECONDS = Number(process.env.MINT_COOLDOWN_SECONDS || 600);
const mintCooldownByAddress = new Map();

function isCoolingDown(address) {
  const key = String(address || "").toLowerCase();
  const now = Math.floor(Date.now() / 1000);
  const last = mintCooldownByAddress.get(key) || 0;
  const remaining = (last + MINT_COOLDOWN_SECONDS) - now;
  return { remaining: Math.max(0, remaining), now, last, key };
}

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

app.get("/config", async (req, res) => {
  res.json({
    ok: true,
    chainId: Number(process.env.CHAIN_ID || 0),
    rpc: process.env.RPC_URL ? "set" : "missing",
    usdc: process.env.USDC_ADDRESS || null,
    attestor: wallet.address,
  });
});

app.post("/mint", mintLimiter, async (req, res) => {
  try {
    const apiKey = req.header("x-api-key");
    if (!process.env.MINT_API_KEY || apiKey !== process.env.MINT_API_KEY) {
      return res.status(401).json({ ok: false, error: "unauthorized" });
    }

    const { to, amount } = req.body || {};
    if (!to || !ethers.isAddress(to)) {
      return res.status(400).json({ ok: false, error: "invalid_to" });
    }
    const cd = isCoolingDown(to);
    if (cd.remaining > 0) {
      return res.status(429).json({
        ok: false,
        error: "mint_cooldown",
        retryAfterSeconds: cd.remaining,
      });
    }

    const human = String(amount ?? "1000");
    if (!/^\d+(\.\d+)?$/.test(human)) {
      return res.status(400).json({ ok: false, error: "invalid_amount" });
    }

    const rpc = process.env.RPC_URL;
    const usdc = process.env.USDC_ADDRESS;
    const pk = process.env.MINTER_PRIVATE_KEY;

    if (!rpc || !usdc || !pk) {
      return res.status(500).json({ ok: false, error: "missing_env" });
    }

    const provider = new ethers.JsonRpcProvider(rpc);
    const minter = new ethers.Wallet(pk, provider);
    const net = await provider.getNetwork();
    const EXPECTED_CHAIN_ID = Number(process.env.CHAIN_ID || "84532");
    if (Number(net.chainId) !== EXPECTED_CHAIN_ID) {
      return res.status(500).json({
        ok: false,
        error: "wrong_chain_for_mint",
        expectedChainId: EXPECTED_CHAIN_ID,
        rpcChainId: Number(net.chainId),
      });
    }
    const code = await provider.getCode(usdc);

    if (code === "0x") {
      return res.status(500).json({
        ok: false,
        error: "usdc_has_no_code_on_rpc",
        rpcChainId: Number(net.chainId),
        usdc,
        codeLength: code.length,
      });
    }

    const abi = [
      "function mint(address to, uint256 amount) external",
      "function decimals() view returns (uint8)",
    ];

    const c = new ethers.Contract(usdc, abi, minter);
    // debug: raw eth_call decimals()
    const raw = await provider.call({ to: usdc, data: "0x313ce567" });
    const dec = Number(raw);
    const amt = ethers.parseUnits(human, dec);

    const tx = await c.mint(to, amt);
    await tx.wait();
    mintCooldownByAddress.set(String(to).toLowerCase(), Math.floor(Date.now() / 1000));

    res.json({ ok: true, txHash: tx.hash, to, amount: human, usdc });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
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
