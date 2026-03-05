import { useEffect, useMemo, useState } from "react";
import { ethers, NonceManager } from "ethers";
import { AgentPayClient } from "railent-sdk";
import { CONFIG } from "./config";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/badge";
import { CopyButton } from "./components/CopyButton";
import { Pill } from "./components/Pill";
import { Stepper } from "./components/Stepper";
import { Callout } from "./components/Callout";
import { ExternalLink } from "./components/ExternalLink";
import { addrUrl, txUrl } from "./lib/explorer";
import { AgentCard, type AgentMeta } from "./components/AgentCard";
import { Skeleton } from "./components/Skeleton";
import { Modal } from "./components/Modal";

function shortAddr(a?: string | null) {
  if (!a) return "";
  return a.slice(0, 6) + "…" + a.slice(-4);
}

function toHttpUri(uri: string) {
  return /^https?:\/\//i.test(uri) ? uri : null;
}

export default function App() {
  type TaskHistoryItem = {
    id: bigint;
    client: string;
    agent: string;
    amount: bigint;
    status: "None" | "Created" | "Funded" | "Released" | "Refunded";
    metadataURI: string;
    txHash: string;
    blockNumber: number;
    timestamp: number;
  };
  type AgentRegistryItem = {
    address: string;
    payout: string;
    active: boolean;
    metadataURI: string;
  };

  const [clientAddress, setClientAddress] = useState<string | null>(null);
  const [agentAddress, setAgentAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [usdcBalance, setUsdcBalance] = useState<string>("0");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  const [taskAgent, setTaskAgent] = useState("");
  const [taskURI, setTaskURI] = useState("ipfs://task/demo");
  const [amount, setAmount] = useState("10");
  const [metadataURI, setMetadataURI] = useState("https://example.com/agent.json");
  const [payout, setPayout] = useState("");
  const [taskId, setTaskId] = useState("");
  const [resultJson, setResultJson] = useState(`{"ok":true,"note":"done"}`);
  const [currentTaskStatus, setCurrentTaskStatus] = useState<"None" | "Created" | "Funded" | "Released" | "Refunded">("None");
  const [agents, setAgents] = useState<AgentRegistryItem[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(false);
  const [agentMetaByAddress, setAgentMetaByAddress] = useState<Record<string, AgentMeta | null>>({});
  const [selectedAgent, setSelectedAgent] = useState<{ address: string; meta?: AgentMeta | null } | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<TaskHistoryItem[]>([]);
  const [historyFilter, setHistoryFilter] = useState<"all" | "client" | "agent">("all");
  const [historyLookback, setHistoryLookback] = useState(5000);
  const [historyLoading, setHistoryLoading] = useState(false);

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
  const activeAddress = clientAddress || agentAddress || null;
  const isConnected = !!activeAddress;
  const isRightChain = (chainId ?? CONFIG.chainId) === CONFIG.chainId;
  const usdc = Number(usdcBalance ?? 0);
  const hasEnoughUsdc = usdc >= 5;

  function statusTone(status: string) {
    const s = status.toLowerCase();
    if (s.includes("released")) return "border-emerald-500/25 bg-emerald-500/10 text-emerald-200";
    if (s.includes("fund")) return "border-sky-500/25 bg-sky-500/10 text-sky-200";
    if (s.includes("refund")) return "border-amber-500/25 bg-amber-500/10 text-amber-200";
    return "border-white/10 bg-white/5 text-white/80";
  }

  function statusFromIndex(i: number): TaskHistoryItem["status"] {
    if (i === 1) return "Created";
    if (i === 2) return "Funded";
    if (i === 3) return "Released";
    if (i === 4) return "Refunded";
    return "None";
  }

  async function getLogsChunked(
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

  const flowSteps = [
    { title: "Connect", desc: "Wallet + Base Sepolia" },
    { title: "Create task", desc: "Define agent, amount, metadata" },
    { title: "Fund escrow", desc: "Approve + lock USDC" },
    { title: "Release payout", desc: "Attested release to agent" },
  ];

  let flowStep = 0;
  if (isConnected && isRightChain) flowStep = 1;
  if (taskId) flowStep = 2;
  if (currentTaskStatus === "Funded") flowStep = 3;
  const released = currentTaskStatus === "Released";

  async function connectMetaMask(setAddr: (a: string) => void) {
    if (!(window as any).ethereum) throw new Error("MetaMask not found");
    const browserProvider = new ethers.BrowserProvider((window as any).ethereum);
    await browserProvider.send("eth_requestAccounts", []);

    const network = await browserProvider.getNetwork();
    const currentChainId = Number(network.chainId);
    setChainId(currentChainId);

    if (currentChainId !== CONFIG.chainId) {
      throw new Error(`Wrong network: please switch MetaMask to chainId ${CONFIG.chainId}`);
    }

    const mmSigner = await browserProvider.getSigner();
    const addr = await mmSigner.getAddress();
    setSigner(mmSigner);
    setAddr(addr);
  }

  async function connectHardhatAccount(index: 1 | 2, setAddr: (a: string) => void) {
    const keys = [
      "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
      "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
    ];
    const raw = new ethers.Wallet(keys[index - 1], provider);
    const managed = new NonceManager(raw);
    const addr = await managed.getAddress();
    setSigner(managed);
    setAddr(addr);
    setChainId(CONFIG.chainId);
  }

  async function refreshUsdcBalance(address?: string | null) {
    try {
      const who = address || activeAddress;
      if (!who) return;

      const erc20 = new ethers.Contract(
        CONFIG.usdc,
        [
          "function balanceOf(address) view returns (uint256)",
          "function decimals() view returns (uint8)",
        ],
        provider
      );

      const dec: number = await erc20.decimals();
      const bal: bigint = await erc20.balanceOf(who);
      const human = Number(ethers.formatUnits(bal, dec));
      setUsdcBalance(human.toFixed(2));
    } catch (e: any) {
      console.warn("refreshUsdcBalance failed:", e?.message || e);
    }
  }

  async function connectClient() {
    setError("");
    try {
      if (isLocal) {
        await connectHardhatAccount(1, setClientAddress);
      } else {
        await connectMetaMask(setClientAddress);
      }
      setStatus("Connected as client");
      await refreshUsdcBalance(clientAddress);
    } catch (e: any) {
      setError(String(e?.message || e));
    }
  }

  async function connectAgent() {
    setError("");
    try {
      if (isLocal) {
        await connectHardhatAccount(2, setAgentAddress);
      } else {
        await connectMetaMask(setAgentAddress);
      }
      setStatus("Connected as agent");
      await refreshUsdcBalance(agentAddress);
    } catch (e: any) {
      setError(String(e?.message || e));
    }
  }

  async function onMintTestTokens() {
    try {
      setError("");
      if (!activeAddress) throw new Error("Connect wallet first");
      setBusy(true);

      const r = await fetch("/api/mint", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ to: activeAddress, amount: "1000" }),
      });

      const data = await r.json().catch(async () => ({ ok: false, error: await r.text() }));
      if (!r.ok || !data.ok) throw new Error(data.error || "mint_failed");

      setStatus(`Minted 1000 mUSDC (${String(data.txHash || "").slice(0, 10)}...)`);
      await refreshUsdcBalance(activeAddress);
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setBusy(false);
    }
  }

  async function loadHistory(lookback: number) {
    try {
      setHistoryLoading(true);
      const latest = await provider.getBlockNumber();
      const fromBlock = Math.max(0, latest - lookback);
      const createdTopic = sdk.escrow.interface.getEvent("TaskCreated")?.topicHash;
      if (!createdTopic) return;

      const logs = await getLogsChunked(
        {
          address: CONFIG.escrow,
          fromBlock,
          toBlock: latest,
          topics: [[createdTopic]],
        },
        10
      );

      const rows = await Promise.all(
        logs.map(async (log) => {
          const parsed = sdk.escrow.interface.parseLog(log);
          const id = BigInt((parsed?.args?.taskId as bigint | number | string) ?? 0);
          const task = await sdk.getTask(id as any);
          const block = await provider.getBlock(log.blockNumber);
          return {
            id,
            client: String(task.client),
            agent: String(task.agent),
            amount: task.amount as bigint,
            status: statusFromIndex(Number(task.status)),
            metadataURI: String(task.metadataURI),
            txHash: log.transactionHash,
            blockNumber: log.blockNumber,
            timestamp: block?.timestamp ?? 0,
          } as TaskHistoryItem;
        })
      );

      rows.sort((a, b) => Number(b.id - a.id));
      setHistoryItems(rows);
    } catch (e: any) {
      setError(String(e?.shortMessage || e?.message || e));
    } finally {
      setHistoryLoading(false);
    }
  }

  async function loadAgentMetadata(agentList: AgentRegistryItem[]) {
    const entries = await Promise.all(
      agentList.map(async (a) => {
        const httpUri = toHttpUri(String(a.metadataURI || ""));
        if (!httpUri) return [a.address, null] as const;
        try {
          const res = await fetch(httpUri);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const meta = (await res.json()) as AgentMeta;
          return [a.address, meta] as const;
        } catch {
          return [a.address, null] as const;
        }
      })
    );
    setAgentMetaByAddress((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
  }

  async function loadAgents() {
    try {
      setAgentsLoading(true);
      const latest = await provider.getBlockNumber();
      const fromBlock = Math.max(0, latest - 5000);
      const registeredTopic = sdk.registry.interface.getEvent("AgentRegistered")?.topicHash;
      const updatedTopic = sdk.registry.interface.getEvent("AgentUpdated")?.topicHash;
      const topics = [[registeredTopic, updatedTopic].filter(Boolean) as string[]];
      if (topics[0].length === 0) return;

      const logs = await getLogsChunked(
        {
          address: CONFIG.registry,
          fromBlock,
          toBlock: latest,
          topics,
        },
        10
      );

      const map = new Map<string, AgentRegistryItem>();
      for (const log of logs) {
        const parsed = sdk.registry.interface.parseLog(log);
        const agent = String(parsed?.args?.agent || "");
        if (!agent) continue;
        const data = await sdk.getAgent(agent as any);
        map.set(agent, {
          address: agent,
          payout: String(data.payout),
          active: Boolean(data.active),
          metadataURI: String(data.metadataURI),
        });
      }

      const list = Array.from(map.values());
      setAgents(list);
      await loadAgentMetadata(list);
    } catch (e: any) {
      setError(String(e?.shortMessage || e?.message || e));
    } finally {
      setAgentsLoading(false);
    }
  }

  async function registerAgent() {
    try {
      setError("");
      if (!signer || !activeAddress) throw new Error("Connect wallet first");
      setBusy(true);
      const targetPayout = payout || activeAddress;
      await sdk.registerAgent(metadataURI, targetPayout as any);
      setStatus("Agent registered");
      await loadAgents();
    } catch (e: any) {
      setError(String(e?.shortMessage || e?.message || e));
    } finally {
      setBusy(false);
    }
  }

  function onViewAgent(agent: string, meta?: AgentMeta | null) {
    setSelectedAgent({ address: agent, meta });
    setIsProfileOpen(true);
  }

  function onCreateTaskPrefill(agent: string, meta?: AgentMeta | null) {
    setTaskAgent(agent);
    const rate = meta?.pricing?.rate || "";
    const firstNum = rate.match(/[0-9]+(?:\\.[0-9]+)?/)?.[0];
    if (firstNum) setAmount(firstNum);
    setStatus("Task form prefilled from agent profile");
  }

  async function createAndFund() {
    try {
      setError("");
      if (!signer || !activeAddress) throw new Error("Connect wallet first");
      if (!taskAgent) throw new Error("Select agent address");
      if (!isRightChain) throw new Error(`Switch to chainId ${CONFIG.chainId}`);
      setBusy(true);
      setStatus("Creating and funding task...");

      const usdcContract = new ethers.Contract(
        CONFIG.usdc,
        [
          "function approve(address spender, uint256 value) external returns (bool)",
          "function decimals() view returns (uint8)",
        ],
        signer
      );

      const decimals: number = await usdcContract.decimals();
      const amt = ethers.parseUnits(amount, decimals);
      await (await usdcContract.approve(CONFIG.escrow, amt)).wait();

      const deadline = Math.floor(Date.now() / 1000) + 3600;
      const id = await sdk.createTask({
        agent: taskAgent as any,
        token: CONFIG.usdc as any,
        amount: amt,
        deadline,
        metadataURI: taskURI,
      });

      let finalId = id;
      if (!finalId || finalId === 0n) {
        const nextId: bigint = await sdk.escrow.nextTaskId();
        finalId = nextId - 1n;
      }

      setCurrentTaskStatus("Created");
      await sdk.fundTask(finalId);
      setTaskId(finalId.toString());
      setCurrentTaskStatus("Funded");
      setStatus(`Task funded: ${finalId.toString()}`);
      await refreshUsdcBalance(activeAddress);
      await loadHistory(historyLookback);
    } catch (e: any) {
      setError(String(e?.shortMessage || e?.message || e));
      setStatus("Failed to create/fund task");
    } finally {
      setBusy(false);
    }
  }

  async function releaseViaAttestation() {
    try {
      setError("");
      if (!taskId) throw new Error("Missing taskId");
      if (!activeAddress) throw new Error("Connect wallet first");
      if (!isRightChain) throw new Error(`Switch to chainId ${CONFIG.chainId}`);
      setBusy(true);
      setStatus("Requesting attestation...");

      const attest = await sdk.requestAttestation({
        taskId,
        client: (clientAddress || activeAddress) as any,
        agent: taskAgent as any,
        result: JSON.parse(resultJson),
        ttlSeconds: 600,
      });

      setStatus("Submitting releaseWithAttestation...");
      await sdk.releaseWithAttestation({
        taskId: BigInt(taskId),
        resultHash: attest.resultHash,
        validUntil: attest.validUntil,
        signature: attest.signature,
      });

      setCurrentTaskStatus("Released");
      setStatus("Released with attestation");
      await loadHistory(historyLookback);
    } catch (e: any) {
      setError(String(e?.shortMessage || e?.message || e));
      setStatus("Failed to release");
    } finally {
      setBusy(false);
    }
  }

  function renderCreateFundForm() {
    return (
      <div className="space-y-3">
        <div className="grid gap-2">
          <label className="text-sm text-white/70">Agent address</label>
          <input
            className="h-11 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none"
            value={taskAgent}
            onChange={(e) => setTaskAgent(e.target.value)}
            placeholder="0x..."
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm text-white/70">Task metadata URI</label>
          <input
            className="h-11 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none"
            value={taskURI}
            onChange={(e) => setTaskURI(e.target.value)}
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm text-white/70">Amount (mUSDC)</label>
          <input
            className="h-11 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={createAndFund}
            disabled={!isConnected || !isRightChain || busy || !taskAgent || !hasEnoughUsdc}
          >
            Create + Fund
          </Button>
          <Badge>taskId: {taskId || "—"}</Badge>
          <Badge>status: {currentTaskStatus}</Badge>
        </div>
      </div>
    );
  }

  function renderReleaseForm() {
    return (
      <div className="space-y-3">
        <div className="grid gap-2">
          <label className="text-sm text-white/70">Task ID</label>
          <input
            className="h-11 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none"
            value={taskId}
            onChange={(e) => setTaskId(e.target.value)}
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm text-white/70">Result JSON</label>
          <textarea
            className="min-h-[120px] rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none"
            value={resultJson}
            onChange={(e) => setResultJson(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={releaseViaAttestation}
            disabled={!isConnected || !isRightChain || busy || !taskId || currentTaskStatus !== "Funded"}
          >
            Request Attestation + Release
          </Button>
          {released ? <Badge className="border-emerald-500/25 bg-emerald-500/10 text-emerald-200">Done</Badge> : null}
        </div>
      </div>
    );
  }

  useEffect(() => {
    setChainId(CONFIG.chainId);
  }, []);

  useEffect(() => {
    refreshUsdcBalance(activeAddress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeAddress]);

  useEffect(() => {
    loadHistory(historyLookback);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyLookback]);

  useEffect(() => {
    loadAgents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeAddress && !payout) {
      setPayout(activeAddress);
    }
  }, [activeAddress, payout]);

  const filteredHistory = useMemo(() => {
    if (historyFilter === "all") return historyItems;
    if (!activeAddress) return [];
    const me = activeAddress.toLowerCase();
    if (historyFilter === "client") {
      return historyItems.filter((t) => t.client.toLowerCase() === me);
    }
    return historyItems.filter((t) => t.agent.toLowerCase() === me);
  }, [historyFilter, historyItems, activeAddress]);

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-20 border-b border-white/10 bg-black/30 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl border border-railent/30 bg-railent/20" />
            <div>
              <div className="text-sm font-semibold tracking-tight">Railent</div>
              <div className="text-xs text-white/60">Payment rails for AI agents</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Pill label={isRightChain ? "Base Sepolia" : "Wrong network"} tone={isRightChain ? "ok" : "warn"} />
            <Pill
              label={isConnected ? `${shortAddr(activeAddress)} connected` : "Not connected"}
              tone={isConnected ? "ok" : "neutral"}
            />
            {isConnected && <CopyButton value={activeAddress!} />}

            {!isConnected ? (
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={connectClient}>
                  Connect as client
                </Button>
                <Button variant="ghost" size="sm" onClick={connectAgent}>
                  Connect as agent
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-8 grid gap-6 md:grid-cols-2 md:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
              Testnet-ready • Escrow • Attestations • Marketplace
            </div>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight">
              The first payment rail built for autonomous agents.
            </h1>
            <p className="mt-3 text-white/65">
              Create tasks, lock funds in escrow, release payouts with attestations and discover agents in the marketplace.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button>New task</Button>
              <Button variant="secondary">Register agent</Button>
              <Button variant="ghost">View history</Button>
            </div>
          </div>

          <Card className="md:w-[420px] md:justify-self-end">
            <CardHeader>
              <CardTitle>Onboarding checks</CardTitle>
              <CardDescription>Everything needed to run the flow safely on testnet.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-white/70">Wallet</span>
                <Badge className={isConnected ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-200" : ""}>
                  {isConnected ? "Connected" : "Not connected"}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-white/70">Network</span>
                <Badge
                  className={
                    isRightChain
                      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-200"
                      : "border-amber-500/25 bg-amber-500/10 text-amber-200"
                  }
                >
                  {isRightChain ? `Base Sepolia (${CONFIG.chainId})` : `Wrong (${chainId ?? "—"})`}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-white/70">USDC balance</span>
                <Badge
                  className={
                    hasEnoughUsdc
                      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-200"
                      : "border-amber-500/25 bg-amber-500/10 text-amber-200"
                  }
                >
                  {isConnected ? `${usdc.toFixed(2)} mUSDC` : "—"}
                </Badge>
              </div>

              {isConnected && isRightChain && !hasEnoughUsdc ? (
                <div className="pt-3">
                  <Button variant="secondary" className="w-full" onClick={onMintTestTokens} disabled={busy}>
                    Receive test tokens
                  </Button>
                  <p className="mt-2 text-xs text-white/55">
                    You need at least 5 mUSDC to create and fund a task.
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <div className="mb-4 grid gap-3">
          {status ? <Callout title={status} tone="info" /> : null}
          {error ? <Callout title="Action failed" tone="bad">{error}</Callout> : null}
          {released ? <Callout title="Flow completed" tone="ok">Task released with attestation.</Callout> : null}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Agents marketplace</CardTitle>
              <CardDescription>Discover agents, inspect profiles, and prefill tasks.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 grid gap-3 md:grid-cols-[1fr_1fr_auto_auto]">
                <input
                  className="h-11 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none"
                  value={metadataURI}
                  onChange={(e) => setMetadataURI(e.target.value)}
                  placeholder="Agent metadata URI (http(s) recommended)"
                />
                <input
                  className="h-11 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none"
                  value={payout}
                  onChange={(e) => setPayout(e.target.value)}
                  placeholder="Payout address"
                />
                <Button variant="secondary" onClick={registerAgent} disabled={busy || !isConnected}>
                  Register agent
                </Button>
                <Button variant="ghost" onClick={loadAgents} disabled={agentsLoading}>
                  Refresh
                </Button>
              </div>

              {agentsLoading ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <Skeleton className="h-48" />
                  <Skeleton className="h-48" />
                  <Skeleton className="h-48" />
                </div>
              ) : agents.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <div className="text-sm font-medium text-white">No agents yet</div>
                  <p className="mt-1 text-sm text-white/60">
                    Register an agent to appear in the marketplace and start receiving tasks.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {agents.map((a) => (
                    <AgentCard
                      key={a.address}
                      chainId={chainId ?? undefined}
                      address={a.address}
                      meta={agentMetaByAddress[a.address]}
                      onCreateTask={onCreateTaskPrefill}
                      onView={onViewAgent}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Create & Fund</CardTitle>
              <CardDescription>Client flow: create a task and lock funds in escrow.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
                <Stepper steps={flowSteps.slice(0, 3)} current={Math.min(flowStep, 2)} />
                <div className="space-y-4">{renderCreateFundForm()}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Release (Attested)</CardTitle>
              <CardDescription>Release payout using an attestation signature.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
                <Stepper steps={flowSteps.slice(2, 4)} current={Math.max(0, Math.min(flowStep - 2, 1))} />
                <div className="space-y-4">{renderReleaseForm()}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Task history</CardTitle>
              <CardDescription>All tasks on-chain. Filter as client or agent.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <Button
                  variant={historyFilter === "all" ? "primary" : "secondary"}
                  size="sm"
                  onClick={() => setHistoryFilter("all")}
                >
                  All
                </Button>
                <Button
                  variant={historyFilter === "client" ? "primary" : "secondary"}
                  size="sm"
                  onClick={() => setHistoryFilter("client")}
                >
                  As client
                </Button>
                <Button
                  variant={historyFilter === "agent" ? "primary" : "secondary"}
                  size="sm"
                  onClick={() => setHistoryFilter("agent")}
                >
                  As agent
                </Button>
                <div className="ml-auto flex items-center gap-2">
                  <Badge>lookback: {historyLookback}</Badge>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setHistoryLookback((v) => Math.min(v + 5000, 50000))}
                    disabled={historyLoading || historyLookback >= 50000}
                  >
                    Load more
                  </Button>
                </div>
              </div>

              {historyLoading ? (
                <div className="text-sm text-white/60">Loading history...</div>
              ) : filteredHistory.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <div className="text-sm font-medium text-white">No tasks yet</div>
                  <p className="mt-1 text-sm text-white/60">
                    Tasks are on-chain escrow agreements. Create your first task to start the flow.
                  </p>
                  <div className="mt-4">
                    <Button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
                      Create your first task
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid gap-3">
                  {filteredHistory.map((t) => (
                    <div key={String(t.id)} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={statusTone(t.status)}>{t.status}</Badge>
                        <Badge>#{String(t.id)}</Badge>
                        <Badge>{ethers.formatUnits(t.amount, 6)} mUSDC</Badge>
                        <span className="ml-auto text-xs text-white/55">
                          {t.timestamp ? new Date(t.timestamp * 1000).toLocaleString() : "-"}
                        </span>
                      </div>

                      <div className="mt-3 grid gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="w-20 text-white/55">Client</span>
                          <ExternalLink
                            href={addrUrl(chainId ?? undefined, t.client)}
                            label={shortAddr(t.client)}
                          />
                          <CopyButton value={t.client} />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-20 text-white/55">Agent</span>
                          <ExternalLink
                            href={addrUrl(chainId ?? undefined, t.agent)}
                            label={shortAddr(t.agent)}
                          />
                          <CopyButton value={t.agent} />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-20 text-white/55">Tx</span>
                          <ExternalLink
                            href={txUrl(chainId ?? undefined, t.txHash)}
                            label={shortAddr(t.txHash)}
                          />
                          <CopyButton value={t.txHash} />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-20 text-white/55">Metadata</span>
                          <span className="truncate text-white/70">{t.metadataURI}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Modal
        open={isProfileOpen}
        title={selectedAgent ? `Agent profile ${shortAddr(selectedAgent.address)}` : "Agent profile"}
        onClose={() => setIsProfileOpen(false)}
      >
        {!selectedAgent ? null : (
          <div className="space-y-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-white/60">Address</span>
              <ExternalLink
                href={addrUrl(chainId ?? undefined, selectedAgent.address)}
                label={selectedAgent.address}
              />
              <CopyButton value={selectedAgent.address} />
            </div>
            <div>
              <div className="text-xs text-white/55">Description</div>
              <div className="mt-1 text-white/80">
                {selectedAgent.meta?.description || "No description provided."}
              </div>
            </div>
            <div>
              <div className="text-xs text-white/55">Tags</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {(selectedAgent.meta?.tags || []).length === 0 ? (
                  <Badge>No tags</Badge>
                ) : (
                  (selectedAgent.meta?.tags || []).map((t) => (
                    <Badge key={t} className="bg-white/5 text-white/75">
                      {t}
                    </Badge>
                  ))
                )}
              </div>
            </div>
            <div>
              <div className="text-xs text-white/55">Pricing</div>
              <div className="mt-1 text-white/80">
                {selectedAgent.meta?.pricing?.model || "model: —"} ·{" "}
                {selectedAgent.meta?.pricing?.rate || "rate: —"}
              </div>
            </div>
            {selectedAgent.meta?.website ? (
              <div>
                <div className="text-xs text-white/55">Website</div>
                <ExternalLink href={selectedAgent.meta.website} label={selectedAgent.meta.website} />
              </div>
            ) : null}
            <div className="pt-2">
              <Button onClick={() => onCreateTaskPrefill(selectedAgent.address, selectedAgent.meta)}>
                Create task with this agent
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
