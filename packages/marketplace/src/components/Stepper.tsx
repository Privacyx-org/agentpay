import { cn } from "./ui/utils";
import { Check } from "lucide-react";

export function Stepper({
  steps,
  current,
}: {
  steps: { title: string; desc?: string }[];
  current: number;
}) {
  return (
    <div className="grid gap-3">
      {steps.map((s, idx) => {
        const done = idx < current;
        const active = idx === current;

        return (
          <div key={s.title} className="flex items-start gap-3">
            <div
              className={cn(
                "mt-0.5 flex h-7 w-7 items-center justify-center rounded-full border text-xs",
                done
                  ? "border-railent/40 bg-railent/20 text-white"
                  : active
                  ? "border-railent/40 bg-white/5 text-white"
                  : "border-white/10 bg-white/5 text-white/50"
              )}
            >
              {done ? <Check size={16} /> : idx + 1}
            </div>

            <div className="min-w-0">
              <div className={cn("text-sm font-medium", active ? "text-white" : "text-white/75")}>
                {s.title}
              </div>
              {s.desc ? <div className="text-xs text-white/55">{s.desc}</div> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
