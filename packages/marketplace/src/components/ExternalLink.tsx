import { ExternalLink as Ext } from "lucide-react";
import { cn } from "./ui/utils";

export function ExternalLink({
  href,
  label,
  className,
}: {
  href: string | null;
  label: string;
  className?: string;
}) {
  if (!href) return <span className={cn("text-white/60", className)}>{label}</span>;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={cn("inline-flex items-center gap-1 text-white/80 hover:text-white", className)}
    >
      {label}
      <Ext size={14} className="opacity-70" />
    </a>
  );
}
