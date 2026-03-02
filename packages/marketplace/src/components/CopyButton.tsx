import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "./ui/button";

export function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onCopy}
      className="h-8 px-2 text-white/70 hover:text-white"
      title="Copy"
    >
      {copied ? <Check size={16} /> : <Copy size={16} />}
    </Button>
  );
}
