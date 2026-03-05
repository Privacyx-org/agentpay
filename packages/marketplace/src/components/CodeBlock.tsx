import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "./ui/button";

export function CodeBlock({ code, onCopied }: { code: string; onCopied?: () => void }) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      onCopied?.();
      setTimeout(() => setCopied(false), 1100);
    } catch {
      // noop
    }
  }

  return (
    <div className="relative">
      <pre className="overflow-x-auto rounded-2xl border border-white/10 bg-black/40 p-4 text-xs text-white/85">
        <code>{code}</code>
      </pre>

      <div className="absolute right-2 top-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onCopy}
          className="h-8 px-2 text-white/70 hover:bg-white/5 hover:text-white"
          title="Copy"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
        </Button>
      </div>
    </div>
  );
}
