import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Environment, Html } from "@react-three/drei";

const RAILENT_BLUE = "#229eff";

function RailCore() {
  const group = useRef<any>(null);

  const points = useMemo(() => {
    const pts: [number, number, number][] = [];
    for (let i = 0; i < 300; i++) {
      const t = i / 299;
      const x = (t - 0.5) * 24.0;
      const y = Math.sin(t * Math.PI * 2) * 0.10;
      const z = Math.cos(t * Math.PI * 2.2) * 0.14;
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
    g.rotation.y = Math.sin(t * 0.2) * 0.09;
    g.rotation.x = Math.sin(t * 0.14) * 0.045;
    g.position.y = Math.sin(t * 0.28) * 0.05;
  });

  return (
    <group ref={group}>
      <mesh>
        <tubeGeometry args={[curve as any, 900, 0.1, 12, false]} />
        <meshStandardMaterial
          color={RAILENT_BLUE}
          emissive={RAILENT_BLUE}
          emissiveIntensity={0.95}
          roughness={0.35}
          metalness={0.4}
        />
      </mesh>

      <mesh>
        <tubeGeometry args={[curve as any, 900, 0.035, 12, false]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive={RAILENT_BLUE}
          emissiveIntensity={1.2}
          roughness={0.2}
          metalness={0.2}
        />
      </mesh>

      {Array.from({ length: 10 }).map((_, i) => (
        <Float key={i} speed={1.2} rotationIntensity={0.45} floatIntensity={0.6}>
          <mesh position={[-9.2 + i * 2.05, Math.sin(i * 0.8) * 0.08, Math.cos(i * 0.6) * 0.1]}>
            <sphereGeometry args={[0.08, 20, 20]} />
            <meshStandardMaterial
              color={RAILENT_BLUE}
              emissive={RAILENT_BLUE}
              emissiveIntensity={1.0}
              roughness={0.3}
              metalness={0.35}
            />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

function Particles() {
  const ref = useRef<any>(null);

  const { positions } = useMemo(() => {
    const count = 820;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = Math.random() * 10.2;
      const a = Math.random() * Math.PI * 2;

      // Full-height cloud with a stronger density around the rail center.
      const spreadY = (Math.random() - 0.5) * 6.6; // spans most of hero height
      const centerY = (Math.random() - 0.5) * 1.4; // dense core around rail
      const y = Math.random() < 0.72 ? centerY : spreadY;

      pos[i * 3 + 0] = Math.cos(a) * r;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = Math.sin(a) * r * 0.32;
    }
    return { positions: pos };
  }, []);

  useFrame((state) => {
    const p = ref.current;
    if (!p) return;
    const t = state.clock.getElapsedTime();
    p.rotation.y = t * 0.02;
    p.rotation.x = Math.sin(t * 0.12) * 0.022;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.024} color={RAILENT_BLUE} transparent opacity={0.62} />
    </points>
  );
}

export default function Scene3D() {
  return (
    <Canvas dpr={[1, 2]} camera={{ position: [0, 0.25, 11.5], fov: 30 }} gl={{ antialias: true, alpha: true }}>
      <ambientLight intensity={0.55} />
      <directionalLight position={[4, 5, 3]} intensity={1.05} />
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
        <mesh position={[0, 0, -2]}>
          <planeGeometry args={[40, 20]} />
          <meshBasicMaterial color="black" transparent opacity={0.18} />
        </mesh>
      </Suspense>
    </Canvas>
  );
}
