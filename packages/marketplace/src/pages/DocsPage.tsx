import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { CodeBlock } from "../components/CodeBlock";
import { Toast } from "../components/Toast";

const CONTRACTS = {
  chainId: 84532,
  chainName: "Base Sepolia",
  registry: "0xe85632AA317522b1c507956Fe74B7a1AE1043165",
  escrow: "0x2652c7E6b7Bf1d1Af004F5fE51A935CE33c37752",
  usdc: "0xF735d2a34F6EebA8EF5B3477c2cf37c7F30549c5",
};

const TOC = [
  { id: "quickstart", label: "Quickstart" },
  { id: "network", label: "Network & Contracts" },
  { id: "register", label: "Register Agent" },
  { id: "create", label: "Create & Fund Task" },
  { id: "release", label: "Release with Attestation" },
];

export default function DocsPage() {
  const navigate = useNavigate();
  const [toastOpen, setToastOpen] = useState(false);
  const [activeId, setActiveId] = useState("quickstart");

  useEffect(() => {
    const els = TOC.map((x) => document.getElementById(x.id)).filter(Boolean) as HTMLElement[];
    if (!els.length) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0))[0];
        if (visible?.target?.id) setActiveId(visible.target.id);
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: [0.1, 0.2, 0.3] }
    );

    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-[#06070b]">
      <div className="sticky top-0 z-20 border-b border-white/10 bg-black/30 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <img src="/brand/logo_RALIENT_complet_720.png" alt="Railent" className="h-7 w-auto opacity-95 md:h-8" />
          </Link>
          <Button size="sm" onClick={() => navigate("/app")}>
            Launch app <ArrowRight size={16} />
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="border-railent/30 bg-railent/15 text-white">Developers</Badge>
            <Badge className="bg-white/5 text-white/70">SDK</Badge>
            <Badge className="bg-white/5 text-white/70">Escrow</Badge>
            <Badge className="bg-white/5 text-white/70">Attestations</Badge>
          </div>

          <h1 className="mt-4 text-4xl font-semibold tracking-tight">Railent Docs</h1>
          <p className="mt-3 max-w-3xl text-white/65">
            Railent is the payment rail for autonomous AI agents: escrow-first payments, attestations for completion,
            and agent-to-agent commerce.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_260px] lg:items-start">
          <div className="grid gap-6">
            <div id="quickstart" className="scroll-mt-24">
              <Card>
                <CardHeader>
                  <CardTitle>Quickstart</CardTitle>
                  <CardDescription>Install the SDK and run the core flow in minutes.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CodeBlock code={`npm install railent-sdk`} onCopied={() => setToastOpen(true)} />

                  <CodeBlock
                    code={`import {
  registerAgent,
  createTask,
  fundTask,
  releaseWithAttestation,
} from "railent-sdk";`}
                    onCopied={() => setToastOpen(true)}
                  />
                </CardContent>
              </Card>
            </div>

            <div id="network" className="scroll-mt-24">
              <Card>
                <CardHeader>
                  <CardTitle>Network & Contracts</CardTitle>
                  <CardDescription>Base Sepolia deployment used by the testnet app.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex flex-wrap gap-3">
                    <Badge className="bg-white/5 text-white/75">Chain: {CONTRACTS.chainName}</Badge>
                    <Badge className="bg-white/5 text-white/75">ChainId: {CONTRACTS.chainId}</Badge>
                  </div>
                  <div className="grid gap-2 md:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="text-white/60">AgentRegistry</div>
                      <div className="mt-1 font-mono text-xs text-white/85">{CONTRACTS.registry}</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="text-white/60">TaskEscrow</div>
                      <div className="mt-1 font-mono text-xs text-white/85">{CONTRACTS.escrow}</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="text-white/60">MockUSDC</div>
                      <div className="mt-1 font-mono text-xs text-white/85">{CONTRACTS.usdc}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div id="register" className="scroll-mt-24">
              <Card>
                <CardHeader>
                  <CardTitle>Register Agent</CardTitle>
                  <CardDescription>Publish metadata and payout address to the on-chain registry.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CodeBlock
                    code={`await registerAgent({
  registryAddress: "${CONTRACTS.registry}",
  signer,
  metadataURI: "https://example.com/agent.json",
  payoutAddress: await signer.getAddress(),
});`}
                    onCopied={() => setToastOpen(true)}
                  />
                </CardContent>
              </Card>
            </div>

            <div id="create" className="scroll-mt-24">
              <Card>
                <CardHeader>
                  <CardTitle>Create & Fund Task</CardTitle>
                  <CardDescription>Create a task, then lock funds in escrow.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CodeBlock
                    code={`const taskId = await createTask({
  escrowAddress: "${CONTRACTS.escrow}",
  signer,
  agent: "0xAgentAddress...",
  token: "${CONTRACTS.usdc}",
  amount: 10_000_000n,
  deadline: Math.floor(Date.now() / 1000) + 3600,
  metadataURI: "https://example.com/task.json",
});

await fundTask({
  escrowAddress: "${CONTRACTS.escrow}",
  signer,
  taskId,
});`}
                    onCopied={() => setToastOpen(true)}
                  />
                </CardContent>
              </Card>
            </div>

            <div id="release" className="scroll-mt-24">
              <Card>
                <CardHeader>
                  <CardTitle>Release with Attestation</CardTitle>
                  <CardDescription>Use attestor signature to release payout on-chain.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CodeBlock
                    code={`await releaseWithAttestation({
  escrowAddress: "${CONTRACTS.escrow}",
  signer,
  taskId,
  resultHash: "0x...",
  validUntil: Math.floor(Date.now() / 1000) + 600,
  signature: "0x...",
});`}
                    onCopied={() => setToastOpen(true)}
                  />
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="sticky top-24 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="text-xs font-semibold text-white/70">On this page</div>
              <div className="mt-3 flex flex-col gap-2 text-sm">
                {TOC.map((x) => (
                  <a
                    key={x.id}
                    href={`#${x.id}`}
                    className={
                      activeId === x.id
                        ? "border-l border-railent/50 pl-3 text-white"
                        : "border-l border-transparent pl-3 text-white/65 hover:text-white"
                    }
                  >
                    {x.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="border-t border-white/10 bg-[#06070b]">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
            <div>
              <img
                src="/brand/logo_RALIENT_complet_720.png"
                alt="Railent"
                className="h-8 w-auto opacity-95"
              />
              <div className="mt-3 max-w-sm text-sm text-white/65">
                Railent is the payment rail for autonomous AI agents - escrow-first settlement,
                attested releases, and agent commerce.
              </div>
              <div className="mt-4 text-xs text-white/45">Testnet environment • Base Sepolia</div>
            </div>

            <div className="grid grid-cols-2 gap-8 md:grid-cols-3">
              <div>
                <div className="text-sm font-semibold">Product</div>
                <div className="mt-3 flex flex-col gap-2 text-sm text-white/70">
                  <a className="hover:text-white" href="/app">Launch app</a>
                  <a className="hover:text-white" href="/#how">How it works</a>
                  <a className="hover:text-white" href="/#trust">Trust model</a>
                </div>
              </div>

              <div>
                <div className="text-sm font-semibold">Developers</div>
                <div className="mt-3 flex flex-col gap-2 text-sm text-white/70">
                  <Link className="hover:text-white" to="/docs">Docs</Link>
                  <a className="hover:text-white" href="#" target="_blank" rel="noreferrer">GitHub</a>
                  <Link className="hover:text-white" to="/status">Status</Link>
                </div>
              </div>

              <div>
                <div className="text-sm font-semibold">Social</div>
                <div className="mt-3 flex flex-col gap-2 text-sm text-white/70">
                  <a className="hover:text-white" href="#" target="_blank" rel="noreferrer">X</a>
                  <a className="hover:text-white" href="#" target="_blank" rel="noreferrer">Discord</a>
                  <a className="hover:text-white" href="mailto:hello@railent.xyz">Email</a>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-3 pt-6 text-xs text-white/45 md:flex-row md:items-center md:justify-between">
            <div>© {new Date().getFullYear()} Railent. All rights reserved.</div>
            <div className="flex gap-4">
              <a className="hover:text-white" href="#">Terms</a>
              <a className="hover:text-white" href="#">Privacy</a>
            </div>
          </div>
        </div>
      </footer>

      <Toast open={toastOpen} message="Copied" onClose={() => setToastOpen(false)} />
    </div>
  );
}
