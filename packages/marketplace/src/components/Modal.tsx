import type { ReactNode } from "react";
import { cn } from "./ui/utils";
import { X } from "lucide-react";
import { Button } from "./ui/button";

export function Modal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 w-[min(720px,92vw)] -translate-x-1/2 -translate-y-1/2">
        <div className={cn("rounded-2xl border border-white/10 bg-[#07090d] shadow-soft")}>
          <div className="flex items-center justify-between border-b border-white/10 p-4">
            <div className="text-sm font-semibold">{title}</div>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 px-2">
              <X size={18} />
            </Button>
          </div>
          <div className="p-5">{children}</div>
        </div>
      </div>
    </div>
  );
}
