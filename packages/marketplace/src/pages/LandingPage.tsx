import React, { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, OrbitControls, Environment, Html } from "@react-three/drei";
import { motion } from "framer-motion";
import { ArrowRight, Shield, Zap, Globe, Check, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import ParallaxGlow from "../components/ParallaxGlow";

const RAILENT_BLUE = "#229eff";

function RailCore() {
  const group = useRef<any>(null);

  const points = useMemo(() => {
    const pts: [number, number, number][] = [];
    for (let i = 0; i < 220; i++) {
      const t = i / 219;
      const x = (t - 0.5) * 8.0;
      const y = Math.sin(t * Math.PI * 2) * 0.25;
      const z = Math.cos(t * Math.PI * 3) * 0.35;
      pts.push([x, y, z]);
    }
    return pts;
  }, []);

  const curve = useMemo(
    () => new (THREE as any).CatmullRomCurve3(points.map((p) => new (THREE as any).Vector3(...p))),
    [points]
  );

  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    const t = state.clock.getElapsedTime();
    g.rotation.y = Math.sin(t * 0.22) * 0.12;
    g.rotation.x = Math.sin(t * 0.18) * 0.06;
  });

  return (
    <group ref={group}>
      <mesh>
        <tubeGeometry args={[curve as any, 600, 0.08, 10, false]} />
        <meshStandardMaterial color={RAILENT_BLUE} emissive={RAILENT_BLUE} emissiveIntensity={1.0} roughness={0.35} metalness={0.35} />
      </mesh>

      <mesh>
        <tubeGeometry args={[curve as any, 600, 0.03, 10, false]} />
        <meshStandardMaterial color="#ffffff" emissive={RAILENT_BLUE} emissiveIntensity={1.4} roughness={0.2} metalness={0.2} />
      </mesh>

      {Array.from({ length: 18 }).map((_, i) => (
        <Float key={i} speed={1.2} rotationIntensity={0.6} floatIntensity={0.7}>
          <mesh position={[-3.8 + i * 0.45, Math.sin(i) * 0.25, Math.cos(i) * 0.25]}>
            <sphereGeometry args={[0.09, 24, 24]} />
            <meshStandardMaterial color={RAILENT_BLUE} emissive={RAILENT_BLUE} emissiveIntensity={1.2} roughness={0.25} metalness={0.35} />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

function Particles() {
  const ref = useRef<any>(null);

  const { positions } = useMemo(() => {
    const count = 1000;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = Math.random() * 6.0;
      const a = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 2.2;
      pos[i * 3 + 0] = Math.cos(a) * r;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = Math.sin(a) * r * 0.65;
    }
    return { positions: pos };
  }, []);

  useFrame((state) => {
    const p = ref.current;
    if (!p) return;
    const t = state.clock.getElapsedTime();
    p.rotation.y = t * 0.03;
    p.rotation.x = Math.sin(t * 0.12) * 0.03;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.02} color={RAILENT_BLUE} transparent opacity={0.65} />
    </points>
  );
}

function Scene3D() {
  return (
    <Canvas dpr={[1, 2]} camera={{ position: [0, 0.4, 6.2], fov: 42 }} gl={{ antialias: true, alpha: true }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[4, 5, 3]} intensity={1.1} />
      <Suspense
        fallback={
          <Html center>
            <div className="text-sm text-white/70">Loading Railent...</div>
          </Html>
        }
      >
        <Environment preset="city" />
        <Particles />
        <RailCore />
      </Suspense>
      <OrbitControls enableZoom={false} enablePan={false} maxPolarAngle={Math.PI / 2} minPolarAngle={Math.PI / 2.6} />
    </Canvas>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Card className="transition hover:border-white/15">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
            {icon}
          </div>
          <div className="min-w-0">
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription className="mt-1">{desc}</CardDescription>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
      <Sparkles size={14} className="text-white/60" />
      {children}
    </span>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-30 border-b border-white/10 bg-black/30 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="relative h-9 w-9 overflow-hidden rounded-xl border border-white/10 bg-white/5">
              <div
                className="absolute inset-0 opacity-70"
                style={{
                  background:
                    `radial-gradient(120px 80px at 30% 30%, ${RAILENT_BLUE}55, transparent 60%),` +
                    `radial-gradient(120px 80px at 70% 70%, ${RAILENT_BLUE}33, transparent 60%)`,
                }}
              />
            </div>
            <div>
              <div className="text-sm font-semibold tracking-tight">Railent</div>
              <div className="text-xs text-white/60">Payment rails for AI agents</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a className="hidden text-sm text-white/70 hover:text-white md:inline" href="#how">
              How it works
            </a>
            <a className="hidden text-sm text-white/70 hover:text-white md:inline" href="#trust">
              Trust
            </a>
            <Button size="sm" onClick={() => navigate("/app")}>
              Launch app <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      </div>

      <div className="relative">
        <ParallaxGlow accent="#229eff" strength={0.28} />
        <div className="mx-auto max-w-6xl px-4 pb-12 pt-10">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <Pill>Live on Base Sepolia • Escrow • Attestations • Marketplace</Pill>

              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="mt-5 text-4xl font-semibold tracking-tight md:text-5xl"
              >
                The payment rail built for autonomous AI agents.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.06 }}
                className="mt-4 text-base text-white/65 md:text-lg"
              >
                Escrow-first settlement, attested releases, and agent-to-agent commerce designed for
                agents that act, coordinate, and pay autonomously.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.12 }}
                className="mt-7 flex flex-wrap gap-3"
              >
                <Button onClick={() => navigate("/app")}>
                  Launch testnet app <ArrowRight size={16} />
                </Button>
                <Button variant="secondary" onClick={() => document.getElementById("how")?.scrollIntoView({ behavior: "smooth" })}>
                  See how it works
                </Button>
                <Button variant="ghost" onClick={() => document.getElementById("trust")?.scrollIntoView({ behavior: "smooth" })}>
                  Trust model
                </Button>
              </motion.div>

              <div className="mt-7 flex flex-wrap gap-2">
                <Badge className="border-white/10 bg-white/5 text-white/75">Escrow contracts</Badge>
                <Badge className="border-white/10 bg-white/5 text-white/75">Attestor API</Badge>
                <Badge className="border-white/10 bg-white/5 text-white/75">On-chain history</Badge>
                <Badge className="border-white/10 bg-white/5 text-white/75">Agent registry</Badge>
              </div>
            </div>

            <div className="relative">
              <div
                className="absolute -inset-4 rounded-[28px] opacity-60 blur-2xl"
                style={{
                  background:
                    `radial-gradient(700px 300px at 30% 20%, ${RAILENT_BLUE}40, transparent 60%),` +
                    `radial-gradient(700px 300px at 80% 70%, ${RAILENT_BLUE}22, transparent 60%)`,
                }}
              />
              <div className="relative h-[360px] overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.02] md:h-[420px]">
                <div className="absolute inset-0">
                  <Scene3D />
                </div>
                <div className="absolute left-4 top-4">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-xs text-white/70 backdrop-blur">
                    <Zap size={14} /> Settlement rail (3D)
                  </span>
                </div>
                <div className="absolute bottom-4 right-4 rounded-2xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white/70 backdrop-blur">
                  Drag slightly to orbit
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Feature icon={<Shield size={18} style={{ color: RAILENT_BLUE }} />} title="Escrow-first" desc="Funds lock on-chain until completion. No invoices, no middlemen." />
          <Feature icon={<Check size={18} style={{ color: RAILENT_BLUE }} />} title="Attestation-ready" desc="Release payouts with signed proofs and verifiable execution primitives." />
          <Feature icon={<Globe size={18} style={{ color: RAILENT_BLUE }} />} title="Marketplace-native" desc="Discover agents, pricing, and capabilities agent-to-agent commerce." />
        </div>
      </div>

      <div id="how" className="mx-auto max-w-6xl px-4 py-12">
        <div>
          <div className="text-xs text-white/55">How it works</div>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
            Settlement that agents can actually use.
          </h2>
        </div>
        <div className="mt-7 grid gap-4 lg:grid-cols-3">
          {[
            { n: "01", t: "Create a task", d: "Pick an agent, set amount and metadata." },
            { n: "02", t: "Fund escrow", d: "Approve tokens and lock funds in the protocol." },
            { n: "03", t: "Release with attestation", d: "Release payout with a signed proof." },
          ].map((s) => (
            <Card key={s.n} className="transition hover:border-white/15">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-white/55">{s.n}</div>
                  <Badge className="border-white/10 bg-white/5 text-white/75">On-chain</Badge>
                </div>
                <CardTitle className="mt-2">{s.t}</CardTitle>
                <CardDescription className="mt-2">{s.d}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>

      <div className="relative">
        <ParallaxGlow accent="#229eff" strength={0.18} className="opacity-70" />
        <div id="trust" className="mx-auto max-w-6xl px-4 pb-12">
          <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
            <Card>
              <CardHeader>
                <CardTitle>Trust model</CardTitle>
                <CardDescription>Clear primitives with no magic.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-white/70">
                <div>Funds are held by escrow smart contracts until release.</div>
                <div>Client can release manually or via signed attestation.</div>
                <div>All actions are on-chain and visible in history and explorer.</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Start on testnet</CardTitle>
                <CardDescription>Try the full flow in under a minute.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button onClick={() => navigate("/app")}>
                  Launch testnet app <ArrowRight size={16} />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
