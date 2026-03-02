import { cn } from "./ui/utils";

export function Pill({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "ok" | "warn" | "bad";
}) {
  const tones: Record<string, string> = {
    neutral: "border-white/10 bg-white/5 text-white/70",
    ok: "border-emerald-500/25 bg-emerald-500/10 text-emerald-200",
    warn: "border-amber-500/25 bg-amber-500/10 text-amber-200",
    bad: "border-red-500/25 bg-red-500/10 text-red-200",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs",
        tones[tone]
      )}
    >
      {label}
    </span>
  );
}
