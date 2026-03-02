import type { ReactNode } from "react";
import { cn } from "./ui/utils";

export function Callout({
  title,
  children,
  tone = "info",
}: {
  title: string;
  children?: ReactNode;
  tone?: "info" | "ok" | "warn" | "bad";
}) {
  const map = {
    info: "border-white/10 bg-white/5 text-white/80",
    ok: "border-emerald-500/25 bg-emerald-500/10 text-emerald-100",
    warn: "border-amber-500/25 bg-amber-500/10 text-amber-100",
    bad: "border-red-500/25 bg-red-500/10 text-red-100",
  }[tone];

  return (
    <div className={cn("rounded-2xl border p-4 text-sm", map)}>
      <div className="font-medium">{title}</div>
      {children ? <div className="mt-1 text-white/65">{children}</div> : null}
    </div>
  );
}
