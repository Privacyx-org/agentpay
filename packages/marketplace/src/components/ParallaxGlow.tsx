import { useEffect, useRef } from "react";

export default function ParallaxGlow({
  accent = "#229eff",
  strength = 0.22,
  className = "",
}: {
  accent?: string;
  strength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (reduce) return;

    const el = ref.current;
    if (!el) return;

    el.style.setProperty("--mx", "50%");
    el.style.setProperty("--my", "35%");
    el.style.setProperty("--accent", accent);

    let targetX = 0.5;
    let targetY = 0.35;
    let currentX = targetX;
    let currentY = targetY;

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      targetX = Math.max(0, Math.min(1, x));
      targetY = Math.max(0, Math.min(1, y));
    };

    const onLeave = () => {
      targetX = 0.5;
      targetY = 0.35;
    };

    const tick = () => {
      const s = 0.08;
      currentX += (targetX - currentX) * s;
      currentY += (targetY - currentY) * s;

      const px = 50 + (currentX - 0.5) * 100 * strength;
      const py = 35 + (currentY - 0.35) * 100 * strength;

      el.style.setProperty("--mx", `${px}%`);
      el.style.setProperty("--my", `${py}%`);

      raf.current = requestAnimationFrame(tick);
    };

    raf.current = requestAnimationFrame(tick);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);

    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
    };
  }, [accent, strength]);

  return (
    <div
      ref={ref}
      aria-hidden
      className={["pointer-events-none absolute inset-0 -z-10", className].join(" ")}
      style={{
        background: `
radial-gradient(900px 520px at var(--mx) var(--my), color-mix(in srgb, var(--accent) 22%, transparent), transparent 60%),
radial-gradient(800px 520px at calc(var(--mx) + 18%) calc(var(--my) + 8%), color-mix(in srgb, var(--accent) 14%, transparent), transparent 62%),
radial-gradient(900px 700px at 20% 10%, rgba(34, 158, 255, 0.12), transparent 60%),
linear-gradient(180deg, rgba(255,255,255,0.04), transparent 30%)
        `,
        filter: "blur(0px)",
      }}
    />
  );
}
