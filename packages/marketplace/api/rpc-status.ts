import type { VercelRequest, VercelResponse } from "@vercel/node";

type JsonRpcReq = { jsonrpc: "2.0"; id: number; method: string; params: any[] };

async function rpc(rpcUrl: string, method: string, params: any[] = [], id = 1) {
  const payload: JsonRpcReq = { jsonrpc: "2.0", id, method, params };
  const res = await fetch(rpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!res.ok) return { ok: false, error: `${res.status} ${res.statusText}`, raw: json };
  if (json?.error) return { ok: false, error: json.error?.message || "rpc_error", raw: json };
  return { ok: true, result: json?.result };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "method_not_allowed" });

  const rpcUrl = process.env.RPC_URL || process.env.VITE_RPC_URL;
  const expectedChainId = Number(process.env.CHAIN_ID || "84532");
  const registry = process.env.REGISTRY_ADDRESS || process.env.VITE_REGISTRY_ADDRESS;
  const escrow = process.env.ESCROW_ADDRESS || process.env.VITE_ESCROW_ADDRESS;
  const usdc = process.env.USDC_ADDRESS || process.env.VITE_USDC_ADDRESS;

  if (!rpcUrl) return res.status(500).json({ error: "missing_rpc_url" });
  if (!registry || !escrow || !usdc) {
    return res.status(500).json({ error: "missing_contract_addresses" });
  }

  const t0 = Date.now();
  const chainIdResp = await rpc(rpcUrl, "eth_chainId", [], 1);
  const blockResp = await rpc(rpcUrl, "eth_blockNumber", [], 2);
  const [codeRegistry, codeEscrow, codeUsdc] = await Promise.all([
    rpc(rpcUrl, "eth_getCode", [registry, "latest"], 3),
    rpc(rpcUrl, "eth_getCode", [escrow, "latest"], 4),
    rpc(rpcUrl, "eth_getCode", [usdc, "latest"], 5),
  ]);

  const latencyMs = Date.now() - t0;
  const chainId = chainIdResp.ok && typeof chainIdResp.result === "string" ? parseInt(chainIdResp.result, 16) : null;
  const blockNumber = blockResp.ok && typeof blockResp.result === "string" ? parseInt(blockResp.result, 16) : null;
  const hasCode = (x: any) => x?.ok && typeof x?.result === "string" && x.result !== "0x";

  return res.status(200).json({
    ok: chainIdResp.ok && blockResp.ok,
    latencyMs,
    expectedChainId,
    chainId,
    chainOk: chainId === expectedChainId,
    blockNumber,
    code: {
      registry: hasCode(codeRegistry),
      escrow: hasCode(codeEscrow),
      usdc: hasCode(codeUsdc),
    },
  });
}
