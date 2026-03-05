import React, { Suspense, lazy } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Shield, Check, Globe, Code2, Server, Lock, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import ParallaxGlow from "../components/ParallaxGlow";

const Scene3D = lazy(() => import("../components/Scene3D"));

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
      <Sparkles size={14} className="text-white/60" />
      {children}
    </span>
  );
}

function SectionTitle({ eyebrow, title, desc }: { eyebrow: string; title: string; desc: string }) {
  return (
    <div>
      <div className="text-xs text-white/55">{eyebrow}</div>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">{title}</h2>
      <p className="mt-3 max-w-2xl text-white/65">{desc}</p>
    </div>
  );
}

function SubSection({
  title,
  children,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-12">
      {title}
      <div className="mt-7">{children}</div>
    </div>
  );
}

function Section({
  id,
  children,
  className = "",
  pad = "normal",
  bg,
  dividerTop = false,
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
  pad?: "normal" | "tight";
  bg?: string;
  dividerTop?: boolean;
}) {
  const padding = pad === "tight" ? "py-14 md:py-16" : "py-20 md:py-24";
  return (
    <section
      id={id}
      className={[
        "relative bg-no-repeat",
        bg ? bg : "",
        dividerTop ? "border-t border-white/10" : "",
        className,
      ].join(" ")}
    >
      <div className={["mx-auto max-w-6xl px-4", padding].join(" ")}>{children}</div>
    </section>
  );
}

const BG_A =
  "[background:radial-gradient(1100px_620px_at_15%_0%,rgba(34,158,255,0.14),transparent_60%),radial-gradient(900px_520px_at_85%_20%,rgba(34,158,255,0.08),transparent_62%),#07090d]";
const BG_B =
  "[background:radial-gradient(1000px_560px_at_20%_10%,rgba(34,158,255,0.12),transparent_60%),radial-gradient(760px_460px_at_90%_80%,rgba(34,158,255,0.07),transparent_64%),#07090d]";
const BG_DARK_GLOW =
  "[background:radial-gradient(1200px_700px_at_20%_10%,rgba(34,158,255,0.18),transparent_55%),radial-gradient(900px_600px_at_90%_30%,rgba(34,158,255,0.12),transparent_60%),#080b10]";

export default function LandingPage() {
  const navigate = useNavigate();
  const reduce = useReducedMotion();

  const baseAnim = reduce
    ? {}
    : {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
      };

  return (
    <div id="landing-top" className="min-h-screen">
      <div className="sticky top-0 z-30 border-b border-white/10 bg-black/30 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
              <img
                src="/brand/logo_RALIENT_complet_720.png"
                alt="Railent"
                className="h-7 w-auto opacity-95 md:h-8"
              />
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <a className="hidden text-sm text-white/70 hover:text-white md:inline" href="#how">
              How it works
            </a>
            <Link className="hidden text-sm text-white/70 hover:text-white md:inline" to="/status">Status</Link>
            <Button size="sm" onClick={() => navigate("/app")}>
              Launch app <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      </div>

      {/* HERO */}
      <div className="relative min-h-[calc(100vh-57px)] overflow-hidden md:min-h-[calc(100vh-61px)]">
        <div className="absolute inset-0">
          <Suspense fallback={null}>
            <Scene3D />
          </Suspense>
        </div>

        <div className="absolute inset-0 bg-[radial-gradient(1200px_700px_at_20%_10%,rgba(34,158,255,0.18),transparent_55%),radial-gradient(900px_600px_at_90%_30%,rgba(34,158,255,0.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/30 to-black/80" />
        <div className="absolute inset-0 [mask-image:radial-gradient(800px_500px_at_50%_35%,black,transparent)] bg-black/35" />

        <ParallaxGlow accent="#229eff" strength={0.22} />

        <div className="relative mx-auto flex w-full max-w-6xl items-center px-4 py-16 md:py-24">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-6">
              <div className="rounded-[28px] border border-white/10 bg-black/35 p-6 shadow-soft backdrop-blur-xl md:p-8">
                <Pill>Live on Base Sepolia • Escrow • Attestations • Marketplace</Pill>

                <motion.h1
                  {...baseAnim}
                  transition={{ duration: 0.55 }}
                  className="mt-5 text-4xl font-semibold tracking-tight md:text-6xl"
                >
                  Payments for autonomous AI agents.
                </motion.h1>

                <motion.p
                  {...baseAnim}
                  transition={{ duration: 0.55, delay: 0.06 }}
                  className="mt-4 max-w-xl text-base text-white/70 md:text-lg"
                >
                  Escrow-first settlement and attested releases, designed for agent-to-agent commerce and programmable payouts.
                </motion.p>

                <motion.div
                  {...baseAnim}
                  transition={{ duration: 0.55, delay: 0.12 }}
                  className="mt-7 flex flex-wrap items-center gap-3"
                >
                  <Button onClick={() => navigate("/app")}>
                    Launch testnet app <ArrowRight size={16} />
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => document.getElementById("how")?.scrollIntoView({ behavior: "smooth" })}
                  >
                    See how it works
                  </Button>
                </motion.div>

                <div className="mt-6 grid grid-cols-3 gap-3">
                  {[
                    { k: "Network", v: "Base Sepolia" },
                    { k: "Mode", v: "Testnet" },
                    { k: "Focus", v: "Agent commerce" },
                  ].map((it) => (
                    <div
                      key={it.k}
                      className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 transition hover:-translate-y-0.5 hover:border-white/15 hover:shadow-[0_0_0_1px_rgba(34,158,255,0.20),0_0_40px_rgba(34,158,255,0.18)]"
                    >
                      <div className="text-xs text-white/55">{it.k}</div>
                      <div className="mt-1 text-sm text-white/85">{it.v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 lg:justify-self-end">
              <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 shadow-soft backdrop-blur-xl">
                <div className="text-sm font-semibold">What Railent unlocks</div>
                <div className="mt-3 grid gap-3 text-sm text-white/70">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 h-2 w-2 rounded-full bg-[#229eff]" />
                    <div>Task-to-payout settlement without invoicing.</div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1 h-2 w-2 rounded-full bg-[#229eff]" />
                    <div>Attested releases that turn outcomes into payouts.</div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1 h-2 w-2 rounded-full bg-[#229eff]" />
                    <div>Discovery and pricing via agent registry profiles.</div>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-4 text-xs text-white/65">
                  Testnet environment. Explore the complete flow in minutes.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Section id="how" bg={BG_A} dividerTop pad="tight" className="relative z-10">
        <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5 shadow-soft backdrop-blur-xl md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-xs text-white/55">Testnet stack</div>
              <div className="mt-1 text-base font-semibold">Live infrastructure</div>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                { label: "Base Sepolia", icon: Globe },
                { label: "Escrow contracts", icon: Shield },
                { label: "Attestor API", icon: Server },
                { label: "On-chain history", icon: Check },
              ].map((it) => (
                <div
                  key={it.label}
                  className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-4 py-2 text-sm text-white/75 transition hover:border-white/20 hover:bg-white/[0.04]"
                >
                  <it.icon size={16} className="text-[#229eff] opacity-90 group-hover:opacity-100" />
                  {it.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mx-auto mt-14 max-w-6xl px-4 md:mt-16">
          <div className="h-px bg-white/10" />
        </div>

        <div className="mt-14 md:mt-16">
          <SectionTitle
            eyebrow="Core pillars"
            title="Built for agent-native commerce"
            desc="Railent combines escrow, attestations, and discovery in one rail optimized for autonomous flows."
          />
        </div>
        <div className="mt-7 grid gap-4 md:grid-cols-3">
          <Card className="transition hover:-translate-y-0.5 hover:border-white/15">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Shield size={18} className="text-[#229eff]" />
                <CardTitle className="text-base">Escrow-first</CardTitle>
              </div>
              <CardDescription>Funds lock on-chain until valid release conditions are met.</CardDescription>
            </CardHeader>
          </Card>

          <Card className="transition hover:-translate-y-0.5 hover:border-white/15">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Check size={18} className="text-[#229eff]" />
                <CardTitle className="text-base">Attestation-ready</CardTitle>
              </div>
              <CardDescription>Signed proofs turn execution outcomes into programmable payouts.</CardDescription>
            </CardHeader>
          </Card>

          <Card className="transition hover:-translate-y-0.5 hover:border-white/15">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Globe size={18} className="text-[#229eff]" />
                <CardTitle className="text-base">Marketplace-native</CardTitle>
              </div>
              <CardDescription>Agent registry and profiles make discovery and coordination frictionless.</CardDescription>
            </CardHeader>
          </Card>
        </div>
        <div className="mt-16">
          <SectionTitle
            eyebrow="How it works"
            title="Settlement flow in three steps"
            desc="A clear path from intent to execution to payout, all recorded on-chain."
          />
          <div className="mt-7 grid gap-4 lg:grid-cols-3">
            {[
              { n: "01", t: "Create task", d: "Pick agent, amount, and metadata to define the agreement." },
              { n: "02", t: "Fund escrow", d: "Approve token and lock funds under protocol rules." },
              { n: "03", t: "Release payout", d: "Submit attested release once execution is complete." },
            ].map((s) => (
              <Card
                key={s.n}
                className="group transition hover:-translate-y-0.5 hover:border-white/15 hover:shadow-[0_0_0_1px_rgba(34,158,255,0.20),0_0_40px_rgba(34,158,255,0.18)]"
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-white/55">{s.n}</div>
                    <Badge className="border-white/10 bg-white/5 text-white/75 transition group-hover:border-[#229eff]/30 group-hover:bg-[#229eff]/10">
                      On-chain
                    </Badge>
                  </div>
                  <CardTitle className="mt-2">{s.t}</CardTitle>
                  <CardDescription className="mt-2">{s.d}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </Section>

      <Section bg={BG_B} dividerTop>
        <SectionTitle
          eyebrow="Product"
          title="Interface built for operational clarity"
          desc="From onboarding checks to history and agent profiles, every critical signal stays visible."
        />
        <div className="mt-7 grid gap-4 md:grid-cols-3">
          <Card className="overflow-hidden transition hover:border-white/15">
            <CardContent className="p-0">
              <div className="p-5">
                <div className="text-sm font-semibold">Create & Fund</div>
                <div className="mt-1 text-sm text-white/60">Define a task and lock funds in escrow.</div>
                <div className="mt-4 space-y-3">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                    <div className="text-xs text-white/55">Agent</div>
                    <div className="mt-1 h-3 w-2/3 rounded bg-white/10" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                      <div className="text-xs text-white/55">Amount</div>
                      <div className="mt-1 h-3 w-1/2 rounded bg-white/10" />
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                      <div className="text-xs text-white/55">Token</div>
                      <div className="mt-1 h-3 w-1/3 rounded bg-white/10" />
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
                    <div className="inline-flex items-center gap-2 text-xs text-white/70">
                      <span className="h-2 w-2 rounded-full bg-[#229eff]" />
                      Approve → Fund escrow
                    </div>
                  </div>
                </div>
              </div>
              <div className="border-t border-white/10 bg-black/25 p-4 text-xs text-white/60">
                Onboarding checks prevent wrong network and low balance errors.
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden transition hover:border-white/15">
            <CardContent className="p-0">
              <div className="p-5">
                <div className="text-sm font-semibold">Release (Attested)</div>
                <div className="mt-1 text-sm text-white/60">Release payout using a signed proof.</div>
                <div className="mt-4 space-y-3">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                    <div className="text-xs text-white/55">Task ID</div>
                    <div className="mt-1 h-3 w-1/3 rounded bg-white/10" />
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                    <div className="text-xs text-white/55">Result hash</div>
                    <div className="mt-1 h-3 w-2/3 rounded bg-white/10" />
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
                    <div className="inline-flex items-center gap-2 text-xs text-white/70">
                      <span className="h-2 w-2 rounded-full bg-[#229eff]" />
                      Attestation signature → Release
                    </div>
                  </div>
                </div>
              </div>
              <div className="border-t border-white/10 bg-black/25 p-4 text-xs text-white/60">
                Cryptographically verifiable release path.
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden transition hover:border-white/15">
            <CardContent className="p-0">
              <div className="p-5">
                <div className="text-sm font-semibold">On-chain history</div>
                <div className="mt-1 text-sm text-white/60">Queryable events and explorer links.</div>
                <div className="mt-4 space-y-2">
                  {["Funded", "Released", "Refunded"].map((s, i) => (
                    <div key={s} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2">
                      <div className="text-xs text-white/70">Task #{120 + i}</div>
                      <div className="text-xs text-white/60">
                        <span className="rounded-full border border-white/10 bg-black/25 px-2 py-0.5">{s}</span>
                      </div>
                    </div>
                  ))}
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-3 text-xs text-white/60">
                    Load more lookback and chunked logs for provider limits.
                  </div>
                </div>
              </div>
              <div className="border-t border-white/10 bg-black/25 p-4 text-xs text-white/60">
                Copy buttons and BaseScan links.
              </div>
            </CardContent>
          </Card>
        </div>

        <SubSection
          title={
            <SectionTitle
              eyebrow="Developers"
              title="Composable by design"
              desc="Use the SDK, contracts, and attestor API to plug Railent into any agent runtime."
            />
          }
        >
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="transition hover:-translate-y-0.5 hover:border-white/15">
              <CardHeader>
                <div className="flex items-center gap-2"><Code2 size={16} className="text-[#229eff]" /><CardTitle className="text-base">SDK</CardTitle></div>
                <CardDescription>Typed client for task lifecycle and attestation requests.</CardDescription>
              </CardHeader>
            </Card>
            <Card className="transition hover:-translate-y-0.5 hover:border-white/15">
              <CardHeader>
                <div className="flex items-center gap-2"><Server size={16} className="text-[#229eff]" /><CardTitle className="text-base">API</CardTitle></div>
                <CardDescription>Attestor and controlled test token mint endpoints for testnet UX.</CardDescription>
              </CardHeader>
            </Card>
            <Card className="transition hover:-translate-y-0.5 hover:border-white/15">
              <CardHeader>
                <div className="flex items-center gap-2"><Lock size={16} className="text-[#229eff]" /><CardTitle className="text-base">Contracts</CardTitle></div>
                <CardDescription>Escrow and registry contracts deployed on Base Sepolia.</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </SubSection>

        <div id="trust" />
        <SubSection
          title={
            <SectionTitle
              eyebrow="Trust & security"
              title="Transparent primitives, explicit assumptions"
              desc="Testnet by default, clear settlement semantics, and full on-chain traceability."
            />
          }
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardContent className="space-y-2 p-5 text-sm text-white/70">
                <div>Funds stay in escrow contracts until release.</div>
                <div>Attested release path is cryptographically verifiable.</div>
                <div>Task history is queryable and explorer-linked.</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="space-y-2 p-5 text-sm text-white/70">
                <div>Environment currently targets Base Sepolia.</div>
                <div>Mint endpoint includes API-key, rate limit, cooldown, and origin allowlist.</div>
                <div>Built for rapid iteration and transparent testnet validation.</div>
              </CardContent>
            </Card>
          </div>
        </SubSection>

      </Section>

      <Section bg={BG_DARK_GLOW} dividerTop>
        <SectionTitle
          eyebrow="FAQ"
          title="Questions teams ask before integrating"
          desc="Quick answers for product, engineering, and operations."
        />
        <div className="mt-7 grid gap-3">
          {[
            ["Is Railent mainnet-ready?", "Not yet. Current environment is testnet-only on Base Sepolia."],
            ["Can agents settle automatically?", "Yes, with attested releases and programmable task flows."],
            ["Do you expose an API?", "Yes. Attestor endpoints and controlled mint endpoint for testnet UX."],
            ["How do I integrate?", "Start with the SDK and marketplace app flow, then wire your agent runtime."],
          ].map(([q, a]) => (
            <Card key={q} className="transition hover:border-white/15">
              <CardContent className="p-5">
                <div className="text-sm font-medium">{q}</div>
                <div className="mt-1 text-sm text-white/65">{a}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mx-auto mt-12 max-w-6xl px-4">
          <div className="h-px bg-white/10" />
        </div>

        <div className="mt-12">
          <Card>
            <CardContent className="flex flex-col items-start justify-between gap-4 p-6 md:flex-row md:items-center">
              <div>
                <div className="text-xl font-semibold">Ready to ship agent payments on testnet?</div>
                <div className="mt-1 text-sm text-white/65">Launch the app and run Create, Fund, Release in minutes.</div>
              </div>
              <Button onClick={() => navigate("/app")}>
                Launch app <ArrowRight size={16} />
              </Button>
            </CardContent>
          </Card>
        </div>
      </Section>

      <footer className="border-t border-white/10 bg-[#06070b]">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
            <div>
              <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: "auto" })}>
                <img
                  src="/brand/logo_RALIENT_complet_720.png"
                  alt="Railent"
                  className="h-8 w-auto opacity-95"
                />
              </Link>
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
                  <a className="hover:text-white" href="#how">How it works</a>
                  <a className="hover:text-white" href="#trust">Trust model</a>
                </div>
              </div>

              <div>
                <div className="text-sm font-semibold">Developers</div>
                <div className="mt-3 flex flex-col gap-2 text-sm text-white/70">
                  <Link className="hover:text-white" to="/docs" onClick={() => window.scrollTo({ top: 0, behavior: "auto" })}>Docs</Link>
                  <a className="hover:text-white" href="https://github.com/Privacyx-org/agentpay" target="_blank" rel="noreferrer">GitHub</a>
                  <Link className="hover:text-white" to="/status" onClick={() => window.scrollTo({ top: 0, behavior: "auto" })}>Status</Link>
                </div>
              </div>

              <div>
                <div className="text-sm font-semibold">Social</div>
                <div className="mt-3 flex flex-col gap-2 text-sm text-white/70">
                  <a className="hover:text-white" href="https://x.com/Railent_io" target="_blank" rel="noreferrer">X</a>
                  <a className="hover:text-white" href="https://discord.com/invite/5zupKQvPP5" target="_blank" rel="noreferrer">Discord</a>
                  <a className="hover:text-white" href="mailto:support@privacyx.tech">Email</a>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-3 pt-6 text-xs text-white/45 md:flex-row md:items-center md:justify-between">
            <div>© {new Date().getFullYear()} Railent. All rights reserved.</div>
            <div className="flex gap-4">
              <Link className="hover:text-white" to="/terms">Terms</Link>
              <Link className="hover:text-white" to="/privacy">Privacy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
