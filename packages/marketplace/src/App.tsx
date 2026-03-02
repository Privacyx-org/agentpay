import { useEffect, useMemo, useState } from "react";
import { ethers, NonceManager } from "ethers";
import { AgentPayClient } from "@agentpay/sdk";
import { CONFIG } from "./config";

function short(addr?: string | null) {
  return addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : "";
}

function statusLabel(status: number) {
  switch (status) {
    case 1:
      return "Created";
    case 2:
      return "Funded";
    case 3:
      return "Released";
    case 4:
      return "Refunded";
    default:
      return "None";
  }
}

function toHttpUri(uri: string) {
  return /^https?:\/\//i.test(uri) ? uri : null;
}

function isAlreadyKnownError(e: unknown) {
  const msg = String((e as any)?.message || e || "").toLowerCase();
  return msg.includes("already known");
}

async function getLogsChunked(
  provider: ethers.Provider,
  params: {
    address: string;
    topics?: Array<string | Array<string> | null>;
    fromBlock: number;
    toBlock: number;
  },
  chunkSize = 10
) {
  const out: ethers.Log[] = [];
  for (let start = params.fromBlock; start <= params.toBlock; start += chunkSize) {
    const end = Math.min(params.toBlock, start + chunkSize - 1);
    const part = await provider.getLogs({
      address: params.address,
      topics: params.topics,
      fromBlock: start,
      toBlock: end,
    });
    out.push(...part);
  }
  return out;
}

export default function App() {
  const [account, setAccount] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [agents, setAgents] = useState<any[]>([]);
  const [metadataURI, setMetadataURI] = useState("ipfs://agent/demo");
  const [payout, setPayout] = useState("");
  const [taskAgent, setTaskAgent] = useState("");
  const [taskURI, setTaskURI] = useState("ipfs://task/demo");
  const [amount, setAmount] = useState("10");
  const [taskId, setTaskId] = useState("");
  const [resultJson, setResultJson] = useState(`{"ok":true,"note":"done"}`);
  const [taskHistory, setTaskHistory] = useState<any[]>([]);
  const [taskFilter, setTaskFilter] = useState<"all" | "client" | "agent">("all");
  const [agentMetaByAddress, setAgentMetaByAddress] = useState<Record<string, any>>({});

  const provider = useMemo(() => new ethers.JsonRpcProvider(CONFIG.rpcUrl, CONFIG.chainId), []);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);

  const sdk = useMemo(() => {
    return new AgentPayClient({
      chainId: CONFIG.chainId,
      provider,
      signer: signer ?? undefined,
      escrowAddress: CONFIG.escrow as any,
      registryAddress: CONFIG.registry as any,
      attestorApiUrl: CONFIG.attestorApiUrl,
    });
  }, [provider, signer]);

  const isLocal = CONFIG.chainId === 31337;

  async function connectMetaMask(
    setter: (s: ethers.Signer) => void,
    setAddr: (a: string) => void
  ) {
    if (!(window as any).ethereum) throw new Error("MetaMask not found");

    const browserProvider = new ethers.BrowserProvider((window as any).ethereum);
    await browserProvider.send("eth_requestAccounts", []);

    const network = await browserProvider.getNetwork();
    const chainId = Number(network.chainId);

    if (chainId !== CONFIG.chainId) {
      throw new Error(`Wrong network: please switch MetaMask to chainId ${CONFIG.chainId}`);
    }

    const mmSigner = await browserProvider.getSigner();
    const addr = await mmSigner.getAddress();
    setter(mmSigner);
    setAddr(addr);
    setPayout(addr);
    setStatus(`Connected ${short(addr)}`);
  }

  async function connectHardhatAccount(index = 1) {
    setError("");
    const keys = [
      "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
      "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
    ];

    const raw = new ethers.Wallet(keys[index - 1], provider);

    // Nonce-safe signer for automining networks.
    const managed = new NonceManager(raw);

    setSigner(managed);

    const addr = await managed.getAddress();
    setAccount(addr);
    setPayout(addr);
    setStatus(`Connected ${short(addr)}`);
  }

  async function connectClient() {
    setError("");
    try {
      if (isLocal) return await connectHardhatAccount(1);
      return await connectMetaMask((s) => setSigner(s), (a) => setAccount(a));
    } catch (e: any) {
      console.error(e);
      setError(e?.shortMessage || e?.message || String(e));
      setStatus("❌ Failed to connect client");
    }
  }

  async function connectAgent() {
    setError("");
    try {
      if (isLocal) return await connectHardhatAccount(2);
      return await connectMetaMask((s) => setSigner(s), (a) => setAccount(a));
    } catch (e: any) {
      console.error(e);
      setError(e?.shortMessage || e?.message || String(e));
      setStatus("❌ Failed to connect agent");
    }
  }

  async function loadAgents() {
    try {
      setStatus("Loading agents…");
      const latest = await provider.getBlockNumber();
      const LOOKBACK = 5000;
      const fromBlock = Math.max(0, latest - LOOKBACK);
      const toBlock = latest;

      const reg = sdk.registry;
      const registeredTopic = reg.interface.getEvent("AgentRegistered")?.topicHash;
      const updatedTopic = reg.interface.getEvent("AgentUpdated")?.topicHash;
      const firstTopics = [registeredTopic, updatedTopic].filter(Boolean) as string[];
      if (firstTopics.length === 0) {
        throw new Error("Missing AgentRegistry event topics");
      }
      const topics = [firstTopics];
      const logs = await getLogsChunked(
        provider,
        {
          address: CONFIG.registry,
          fromBlock,
          toBlock,
          topics,
        },
        10
      );

      const map = new Map<string, any>();

      for (const log of logs) {
        const parsed = reg.interface.parseLog(log);
        const agent = parsed?.args?.agent as string | undefined;
        if (!agent) continue;
        const data = await sdk.getAgent(agent as any);
        map.set(agent, {
          agent,
          payout: data.payout,
          active: data.active,
          metadataURI: data.metadataURI,
        });
      }

      const list = Array.from(map.values());
      setAgents(list);
      await loadAgentMetadata(list);
      setStatus(`Loaded ${map.size} agents`);
    } catch (e: any) {
      console.error(e);
      setError(e?.shortMessage || e?.message || String(e));
      setStatus("❌ Failed to load agents");
    }
  }

  async function register() {
    if (busy) return;
    setError("");
    setBusy(true);
    try {
      setStatus("Registering agent…");
      await sdk.registerAgent(metadataURI, payout as any);
      await loadAgents();
    } catch (e: any) {
      if (isAlreadyKnownError(e)) {
        setStatus("⏳ Transaction already submitted (already known). Check MetaMask / explorer.");
        return;
      }
      console.error(e);
      setError(e?.shortMessage || e?.message || String(e));
      setStatus("❌ Failed to register");
    } finally {
      setBusy(false);
    }
  }

  async function loadAgentMetadata(agentList: any[]) {
    const entries = await Promise.all(
      agentList.map(async (a) => {
        const uri = String(a.metadataURI || "");
        const httpUri = toHttpUri(uri);
        if (!httpUri) return [a.agent, null] as const;

        try {
          const res = await fetch(httpUri);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const meta = await res.json();
          return [a.agent, meta] as const;
        } catch (e: any) {
          return [a.agent, { _error: e?.message || "metadata fetch failed" }] as const;
        }
      })
    );

    setAgentMetaByAddress((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
  }

  async function loadTaskHistory() {
    try {
      const latest = await provider.getBlockNumber();
      const LOOKBACK = 5000;
      const fromBlock = Math.max(0, latest - LOOKBACK);
      const toBlock = latest;
      const createdTopic = sdk.escrow.interface.getEvent("TaskCreated")?.topicHash;
      if (!createdTopic) {
        throw new Error("Missing TaskEscrow.TaskCreated topic");
      }
      const logs = await getLogsChunked(
        provider,
        {
          address: CONFIG.escrow,
          fromBlock,
          toBlock,
          topics: [[createdTopic]],
        },
        10
      );

      const rows = await Promise.all(
        logs.map(async (log) => {
          const parsed = sdk.escrow.interface.parseLog(log);
          const id = BigInt((parsed?.args?.taskId as bigint | number | string) ?? 0);
          const t = await sdk.getTask(id as any);
          const block = await provider.getBlock(log.blockNumber);
          return {
            id,
            client: t.client as string,
            agent: t.agent as string,
            amount: t.amount as bigint,
            status: Number(t.status),
            metadataURI: t.metadataURI as string,
            timestamp: block?.timestamp ?? 0,
          };
        })
      );

      rows.sort((a: any, b: any) => Number(b.id - a.id));
      setTaskHistory(rows);
    } catch (e: any) {
      console.error(e);
      setError(e?.shortMessage || e?.message || String(e));
    }
  }

  function prefillTaskFromAgent(agent: string, meta: any) {
    setTaskAgent(agent);

    const firstService =
      Array.isArray(meta?.services) && meta.services.length > 0 ? meta.services[0] : null;
    const nextTaskUri = firstService?.taskURI || firstService?.metadataURI || meta?.defaultTaskURI;
    const nextAmount = firstService?.priceUsdc ?? meta?.pricing?.usdc;

    if (typeof nextTaskUri === "string" && nextTaskUri.length > 0) {
      setTaskURI(nextTaskUri);
    }
    if (
      (typeof nextAmount === "string" && nextAmount.length > 0) ||
      typeof nextAmount === "number"
    ) {
      setAmount(String(nextAmount));
    }
  }

  async function createAndFund() {
    setError("");
    if (busy) return;
    setBusy(true);
    try {
      if (!account || !signer) return;
      setStatus("Mint + approve + create + fund…");

      const usdc = new ethers.Contract(
        CONFIG.usdc,
        [
          "function mint(address to, uint256 amount) external",
          "function approve(address spender, uint256 value) external returns (bool)",
          "function decimals() view returns (uint8)",
        ],
        signer
      );

      const decimals: number = await usdc.decimals();
      const amt = ethers.parseUnits(amount, decimals);

      await (await usdc.mint(account, ethers.parseUnits("1000", decimals))).wait();
      await (await usdc.approve(CONFIG.escrow, amt)).wait();

      const deadline = Math.floor(Date.now() / 1000) + 3600;

      // 1) createTask
      const id = await sdk.createTask({
        agent: taskAgent as any,
        token: CONFIG.usdc as any,
        amount: amt,
        deadline,
        metadataURI: taskURI,
      });

      // Fallback: if parsing failed somehow
      let finalId = id;
      if (!finalId || finalId === 0n) {
        // nextTaskId is public in contract
        const nextId: bigint = await sdk.escrow.nextTaskId();
        finalId = nextId - 1n;
      }

      // 2) fundTask
      await sdk.fundTask(finalId);

      setTaskId(finalId.toString());
      setStatus(`Task funded: ${finalId.toString()}`);
      await loadTaskHistory();
    } catch (e: any) {
      console.error(e);
      setError(e?.shortMessage || e?.message || String(e));
      setStatus("❌ Failed to create/fund task");
    } finally {
      setBusy(false);
    }
  }

  async function mintDemo(amount = "1000") {
    try {
      setError("");
      if (!account) throw new Error("Connect wallet first");

      const r = await fetch("/api/mint", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ to: account, amount }),
      });

      const data = await r
        .json()
        .catch(async () => ({ ok: false, error: await r.text() }));
      if (!r.ok || !data.ok) throw new Error(data.error || "mint_failed");

      setStatus(`✅ Minted ${amount} mUSDC (tx: ${data.txHash?.slice(0, 10)}...)`);
    } catch (e: any) {
      if (isAlreadyKnownError(e)) {
        setStatus("⏳ Transaction already submitted (already known). Check MetaMask / explorer.");
        return;
      }
      setError(String(e?.message || e));
    }
  }

  async function releaseViaAttestation() {
    setError("");
    if (busy) return;
    setBusy(true);
    try {
      if (!taskId || !account) return;

      setStatus("Requesting attestation…");
      const attest = await sdk.requestAttestation({
        taskId,
        client: account as any,
        agent: taskAgent as any,
        result: JSON.parse(resultJson),
        ttlSeconds: 600,
      });

      setStatus("Submitting releaseWithAttestation…");
      await sdk.releaseWithAttestation({
        taskId: BigInt(taskId),
        resultHash: attest.resultHash,
        validUntil: attest.validUntil,
        signature: attest.signature,
      });

      setStatus("✅ Released with attestation");
      await loadTaskHistory();
    } catch (e: any) {
      console.error(e);
      setError(e?.shortMessage || e?.message || String(e));
      setStatus("❌ Failed to release");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    loadAgents();
    loadTaskHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredTaskHistory = useMemo(() => {
    if (taskFilter === "all") return taskHistory;
    if (!account) return [];

    const me = account.toLowerCase();
    if (taskFilter === "client") {
      return taskHistory.filter((t) => String(t.client).toLowerCase() === me);
    }
    return taskHistory.filter((t) => String(t.agent).toLowerCase() === me);
  }, [taskHistory, taskFilter, account]);

  return (
    <div style={{ maxWidth: 980, margin: "40px auto", fontFamily: "ui-sans-serif, system-ui" }}>
      <h1 style={{ marginBottom: 8 }}>AgentPay Marketplace (chain {CONFIG.chainId})</h1>
      <div style={{ opacity: 0.8, marginBottom: 16 }}>
        Chain {CONFIG.chainId} · Escrow {short(CONFIG.escrow)} · Registry {short(CONFIG.registry)}
      </div>

      <div style={{ padding: 14, border: "1px solid #eee", borderRadius: 12, marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <button onClick={connectClient}>Connect Client (Acct1)</button>
          <button onClick={connectAgent}>Connect Agent (Acct2)</button>
          <div>{account ? `Connected: ${short(account)}` : "Not connected"}</div>
        </div>
        <div style={{ marginTop: 10, color: "#555" }}>{status}</div>
        {error && <div style={{ marginTop: 8, color: "crimson" }}>{error}</div>}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ padding: 14, border: "1px solid #eee", borderRadius: 12 }}>
          <h2>Register / Update Agent</h2>
          <div style={{ display: "grid", gap: 10 }}>
            <label>
              metadataURI
              <input value={metadataURI} onChange={(e) => setMetadataURI(e.target.value)} style={{ width: "100%" }} />
            </label>
            <label>
              payout
              <input value={payout} onChange={(e) => setPayout(e.target.value)} style={{ width: "100%" }} />
            </label>
            <button onClick={register} disabled={!account || busy}>Register</button>
          </div>

          <h3 style={{ marginTop: 18 }}>Agents</h3>
          <button onClick={loadAgents}>Refresh</button>
          <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
            {agents.length === 0 && <div style={{ opacity: 0.7 }}>No agents yet. Connect Agent (Acct2) and Register.</div>}
            {agents.map((a) => (
              <div key={a.agent} style={{ padding: 10, border: "1px solid #f0f0f0", borderRadius: 10 }}>
                {(() => {
                  const meta = agentMetaByAddress[a.agent];
                  const tags = Array.isArray(meta?.tags) ? meta.tags : [];
                  return (
                    <div style={{ marginBottom: 8 }}>
                      {meta?.name && <div><b>{meta.name}</b></div>}
                      {meta?.description && <div style={{ fontSize: 12, opacity: 0.85 }}>{meta.description}</div>}
                      {tags.length > 0 && <div style={{ fontSize: 12, opacity: 0.8 }}>tags: {tags.join(", ")}</div>}
                      {meta?.pricing && (
                        <div style={{ fontSize: 12, opacity: 0.8 }}>
                          pricing: {typeof meta.pricing === "string" ? meta.pricing : JSON.stringify(meta.pricing)}
                        </div>
                      )}
                      {meta?._error && <div style={{ fontSize: 12, color: "crimson" }}>metadata error: {meta._error}</div>}
                    </div>
                  );
                })()}
                <div><b>{short(a.agent)}</b> {a.active ? "✅" : "❌"}</div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>payout: {short(a.payout)}</div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>uri: {a.metadataURI}</div>
                <button style={{ marginTop: 6 }} onClick={() => setTaskAgent(a.agent)}>
                  Use as task agent
                </button>
                <button
                  style={{ marginTop: 6, marginLeft: 8 }}
                  onClick={() => prefillTaskFromAgent(a.agent, agentMetaByAddress[a.agent])}
                >
                  Create task (prefill service)
                </button>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: 14, border: "1px solid #eee", borderRadius: 12 }}>
          <h2>Create Task (Client) + Fund</h2>
          <div style={{ display: "grid", gap: 10 }}>
            <label>
              agent
              <input value={taskAgent} onChange={(e) => setTaskAgent(e.target.value)} style={{ width: "100%" }} />
            </label>
            <label>
              metadataURI
              <input value={taskURI} onChange={(e) => setTaskURI(e.target.value)} style={{ width: "100%" }} />
            </label>
            <label>
              amount (USDC)
              <input value={amount} onChange={(e) => setAmount(e.target.value)} style={{ width: "100%" }} />
            </label>

            <button disabled={!account || busy} onClick={() => mintDemo("1000")}>
              Mint 1000 mUSDC (demo)
            </button>
            <button onClick={createAndFund} disabled={!account || !taskAgent || busy}>Create + Fund</button>

            <div style={{ marginTop: 6 }}>
              <b>taskId:</b> {taskId || "(none)"}
            </div>
          </div>

          <h2 style={{ marginTop: 18 }}>Release via Attestation</h2>
          <div style={{ display: "grid", gap: 10 }}>
            <label>
              result JSON
              <textarea value={resultJson} onChange={(e) => setResultJson(e.target.value)} rows={4} style={{ width: "100%" }} />
            </label>
            <button onClick={releaseViaAttestation} disabled={!taskId || busy}>Request Attestation + Release</button>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 16, padding: 14, border: "1px solid #eee", borderRadius: 12 }}>
        <h2>Task History</h2>
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <button onClick={() => setTaskFilter("all")} disabled={taskFilter === "all"}>All</button>
          <button onClick={() => setTaskFilter("client")} disabled={taskFilter === "client"}>As client</button>
          <button onClick={() => setTaskFilter("agent")} disabled={taskFilter === "agent"}>As agent</button>
          <button onClick={loadTaskHistory} disabled={busy}>Refresh</button>
        </div>
        <div style={{ display: "grid", gap: 8 }}>
          {filteredTaskHistory.length === 0 && <div style={{ opacity: 0.7 }}>No tasks found for this filter.</div>}
          {filteredTaskHistory.map((t) => (
            <div key={String(t.id)} style={{ padding: 10, border: "1px solid #f0f0f0", borderRadius: 10 }}>
              <div>
                <b>#{String(t.id)}</b> · {statusLabel(t.status)} · {ethers.formatUnits(t.amount, 6)} USDC
              </div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>
                client: {short(t.client)} · agent: {short(t.agent)}
              </div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>
                metadataURI: {t.metadataURI}
              </div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>
                created: {t.timestamp ? new Date(t.timestamp * 1000).toLocaleString() : "-"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
