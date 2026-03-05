import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, AlertTriangle, XCircle, ExternalLink as Ext, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { addrUrl } from "../lib/explorer";
import { CONFIG } from "../config";
import { CodeBlock } from "../components/CodeBlock";

type Health = { ok: boolean; latencyMs?: number; error?: string };
type AttestorConfig = {
  chainId?: number;
  usdc?: string;
  rpcConfigured?: boolean;
  attestorConfigured?: boolean;
};

function Pill({ tone, label }: { tone: "ok" | "warn" | "bad" | "neutral"; label: string }) {
  const cls =
    tone === "ok"
      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-200"
      : tone === "warn"
      ? "border-amber-500/25 bg-amber-500/10 text-amber-200"
      : tone === "bad"
      ? "border-red-500/25 bg-red-500/10 text-red-200"
      : "border-white/10 bg-white/5 text-white/70";
  return <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs ${cls}`}>{label}</span>;
}

function StatusIcon({ tone }: { tone: "ok" | "warn" | "bad" }) {
  if (tone === "ok") return <CheckCircle2 size={18} className="text-emerald-300" />;
  if (tone === "warn") return <AlertTriangle size={18} className="text-amber-300" />;
  return <XCircle size={18} className="text-red-300" />;
}

async function timedFetch(url: string, init?: RequestInit): Promise<Health & { json?: unknown }> {
  const t0 = performance.now();
  try {
    const res = await fetch(url, init);
    const latencyMs = Math.round(performance.now() - t0);
    const text = await res.text();
    let json: unknown = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }
    if (!res.ok) return { ok: false, latencyMs, error: `${res.status} ${res.statusText}`, json };
    return { ok: true, latencyMs, json };
  } catch (e: any) {
    const latencyMs = Math.round(performance.now() - t0);
    return { ok: false, latencyMs, error: e?.message || "fetch_failed" };
  }
}

export default function StatusPage() {
  const ATTESTOR_BASE = (import.meta.env.VITE_ATTESTOR_API_URL || "/api").replace(/\/$/, "");
  const rpcUrl = CONFIG.rpcUrl;
  const chainName = CONFIG.chainId === 84532 ? "Base Sepolia" : `Chain ${CONFIG.chainId}`;

  const [loading, setLoading] = useState(false);
  const [apiHealth, setApiHealth] = useState<Health>({ ok: false });
  const [apiConfig, setApiConfig] = useState<AttestorConfig | null>(null);
  const [apiConfigRaw, setApiConfigRaw] = useState<unknown>(null);
  const [rpcHealth, setRpcHealth] = useState<Health>({ ok: false });
  const [blockNumber, setBlockNumber] = useState<number | null>(null);
  const [codeChecks, setCodeChecks] = useState<{ registry?: boolean; escrow?: boolean; usdc?: boolean }>({});

  const overallTone = useMemo<"ok" | "warn" | "bad">(() => {
    if (!apiHealth.ok || !rpcHealth.ok) return "bad";
    const hasCodes = !!(codeChecks.registry && codeChecks.escrow && codeChecks.usdc);
    const chainMismatch =
      typeof apiConfig?.chainId === "number" && apiConfig.chainId !== CONFIG.chainId;
    const usdcMismatch =
      typeof apiConfig?.usdc === "string" && apiConfig.usdc.toLowerCase() !== CONFIG.usdc.toLowerCase();
    const configDegraded =
      !apiConfig ||
      apiConfig.rpcConfigured === false ||
      apiConfig.attestorConfigured === false ||
      chainMismatch ||
      usdcMismatch;
    if (!hasCodes || configDegraded) return "warn";
    return "ok";
  }, [
    apiHealth.ok,
    rpcHealth.ok,
    codeChecks.registry,
    codeChecks.escrow,
    codeChecks.usdc,
    apiConfig,
  ]);

  async function checkAll() {
    setLoading(true);

    const health = await timedFetch(`${ATTESTOR_BASE}/health`);
    setApiHealth({ ok: health.ok, latencyMs: health.latencyMs, error: health.error });

    const cfg = await timedFetch(`${ATTESTOR_BASE}/config`);
    const cfgJson = (cfg.json as any) || null;
    setApiConfigRaw(cfgJson);
    const mapped: AttestorConfig | null = cfg.ok
      ? {
          chainId: cfgJson?.chainId ?? cfgJson?.chain_id ?? cfgJson?.chain?.id,
          usdc: cfgJson?.usdc ?? cfgJson?.USDC_ADDRESS ?? cfgJson?.addresses?.usdc,
          rpcConfigured: !!(cfgJson?.rpcConfigured ?? cfgJson?.rpc_configured ?? cfgJson?.rpc),
          attestorConfigured: !!(cfgJson?.attestorConfigured ?? cfgJson?.attestor_configured ?? cfgJson?.attestor),
        }
      : null;
    setApiConfig(mapped);

    const rpcStatus = await timedFetch("/api/rpc-status");
    const statusJson = (rpcStatus.json as any) || null;

    if (rpcStatus.ok && statusJson) {
      setRpcHealth({
        ok: !!statusJson.ok && !!statusJson.chainOk,
        latencyMs: statusJson.latencyMs ?? rpcStatus.latencyMs,
        error: statusJson.chainOk ? undefined : `wrong_chain:${statusJson.chainId ?? "?"}`,
      });
      setBlockNumber(typeof statusJson.blockNumber === "number" ? statusJson.blockNumber : null);
      setCodeChecks({
        registry: !!statusJson.code?.registry,
        escrow: !!statusJson.code?.escrow,
        usdc: !!statusJson.code?.usdc,
      });
    } else {
      // Local DX fallback when Vercel serverless functions are not available under plain vite dev.
      try {
        const t0 = performance.now();
        const chainRes = await fetch(rpcUrl, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_chainId", params: [] }),
        });
        const latencyMs = Math.round(performance.now() - t0);
        const chainData = await chainRes.json();
        const chainIdHex = chainData?.result as string | undefined;
        const chainId = chainIdHex ? parseInt(chainIdHex, 16) : null;

        if (!chainRes.ok || chainId !== CONFIG.chainId) {
          setRpcHealth({
            ok: false,
            latencyMs,
            error: !chainRes.ok ? `${chainRes.status} ${chainRes.statusText}` : `wrong_chain:${chainId ?? "?"}`,
          });
        } else {
          setRpcHealth({ ok: true, latencyMs });
        }

        const blockRes = await fetch(rpcUrl, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ jsonrpc: "2.0", id: 2, method: "eth_blockNumber", params: [] }),
        });
        const blockData = await blockRes.json();
        const bn = blockData?.result ? parseInt(blockData.result, 16) : null;
        setBlockNumber(Number.isFinite(bn) ? bn : null);

        async function hasCode(addr: string, id: number) {
          const r = await fetch(rpcUrl, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ jsonrpc: "2.0", id, method: "eth_getCode", params: [addr, "latest"] }),
          });
          const d = await r.json();
          const code = (d?.result as string) || "0x";
          return code !== "0x";
        }

        const [registry, escrow, usdc] = await Promise.all([
          hasCode(CONFIG.registry, 3),
          hasCode(CONFIG.escrow, 4),
          hasCode(CONFIG.usdc, 5),
        ]);
        setCodeChecks({ registry, escrow, usdc });
      } catch (e: any) {
        setRpcHealth({ ok: false, error: e?.message || "rpc_failed" });
        setBlockNumber(null);
        setCodeChecks({});
      }
    }

    setLoading(false);
  }

  useEffect(() => {
    checkAll();
    const t = setInterval(checkAll, 30_000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const overallLabel = overallTone === "ok" ? "Operational" : overallTone === "warn" ? "Degraded" : "Down";

  return (
    <div className="min-h-screen bg-[#06070b]">
      <div className="sticky top-0 z-20 border-b border-white/10 bg-black/30 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <img src="/brand/logo_RALIENT_complet_720.png" alt="Railent" className="h-7 w-auto opacity-95 md:h-8" />
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={checkAll} disabled={loading}>
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              Refresh
            </Button>
            <Button size="sm" onClick={() => (window.location.href = "/app")}>
              Launch app <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-railent/30 bg-railent/15 text-white">Developers</Badge>
              <Badge className="bg-white/5 text-white/70">Status</Badge>
              <Pill tone="neutral" label={`Testnet • ${chainName}`} />
            </div>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight">Status</h1>
            <p className="mt-2 max-w-2xl text-white/65">
              Live health checks for Railent services on testnet. No secrets are exposed.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <StatusIcon tone={overallTone} />
            <div>
              <div className="text-sm font-semibold">{overallLabel}</div>
              <div className="text-xs text-white/55">Auto-refresh every 30s</div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Attestor API</CardTitle>
              <CardDescription>/health + /config</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-white/65">Health</span>
                <Pill tone={apiHealth.ok ? "ok" : "bad"} label={apiHealth.ok ? `OK • ${apiHealth.latencyMs ?? "?"}ms` : "Down"} />
              </div>

              {!apiHealth.ok && (
                <div className="rounded-2xl border border-red-500/25 bg-red-500/10 p-3 text-xs text-red-100">
                  {apiHealth.error || "unknown_error"}
                </div>
              )}

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-xs text-white/70">
                <div className="font-semibold text-white/80">Config (safe)</div>
                <div className="mt-2 grid gap-1">
                  <div>chainId: {apiConfig?.chainId ?? "—"}</div>
                  <div>usdc: {apiConfig?.usdc ?? "—"}</div>
                  <div>rpcConfigured: {String(apiConfig?.rpcConfigured ?? false)}</div>
                  <div>attestorConfigured: {String(apiConfig?.attestorConfigured ?? false)}</div>
                </div>
              </div>

              {(apiConfig?.rpcConfigured === false ||
                apiConfig?.attestorConfigured === false ||
                apiConfig?.chainId == null) && (
                <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-3 text-xs text-amber-100">
                  Attestor config is incomplete or mismatched. Status is degraded until resolved.
                </div>
              )}

              {apiConfig?.chainId == null && apiConfigRaw != null && (
                <CodeBlock
                  code={`Raw /config:\n${JSON.stringify(apiConfigRaw, null, 2).slice(0, 3000)}`}
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Chain RPC</CardTitle>
              <CardDescription>eth_chainId + eth_blockNumber</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-white/65">RPC</span>
                <Pill tone={rpcHealth.ok ? "ok" : "bad"} label={rpcHealth.ok ? `OK • ${rpcHealth.latencyMs ?? "?"}ms` : "Down"} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/65">Block</span>
                <span className="text-white/80">{blockNumber ? blockNumber.toLocaleString() : "—"}</span>
              </div>

              {!rpcHealth.ok && (
                <div className="rounded-2xl border border-red-500/25 bg-red-500/10 p-3 text-xs text-red-100">
                  {rpcHealth.error || "rpc_error"}
                </div>
              )}

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-xs text-white/70">
                Expected chainId: {CONFIG.chainId} ({chainName})
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contracts</CardTitle>
              <CardDescription>On-chain code presence check</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {[
                { k: "registry", name: "AgentRegistry", addr: CONFIG.registry },
                { k: "escrow", name: "TaskEscrow", addr: CONFIG.escrow },
                { k: "usdc", name: "USDC", addr: CONFIG.usdc },
              ].map((c) => {
                const ok = (codeChecks as any)[c.k] === true;
                return (
                  <div key={c.k} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{c.name}</div>
                      <Pill tone={ok ? "ok" : "warn"} label={ok ? "code: yes" : "code: ?"} />
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <div className="truncate font-mono text-xs text-white/75">{c.addr}</div>
                      <a
                        className="inline-flex items-center gap-1 text-xs text-white/70 hover:text-white"
                        href={addrUrl(CONFIG.chainId, c.addr) || "#"}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Explorer <Ext size={14} className="opacity-70" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-xs text-white/55">
          Testnet only. Status is best-effort and not a security guarantee.
        </div>
      </div>
    </div>
  );
}
