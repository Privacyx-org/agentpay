import { useEffect } from "react";
import { cn } from "./ui/utils";

export function Toast({
  open,
  message,
  onClose,
}: {
  open: boolean;
  message: string;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(onClose, 1400);
    return () => clearTimeout(t);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed bottom-5 left-1/2 z-[60] -translate-x-1/2">
      <div className={cn("rounded-2xl border border-white/10 bg-black/70 px-4 py-2 text-sm text-white/90 shadow-soft backdrop-blur-xl")}>
        {message}
      </div>
    </div>
  );
}
