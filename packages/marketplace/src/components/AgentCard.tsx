import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ExternalLink } from "./ExternalLink";
import { addrUrl } from "../lib/explorer";
import { CopyButton } from "./CopyButton";

function short(a: string) {
  return a.slice(0, 6) + "…" + a.slice(-4);
}

export type AgentMeta = {
  name?: string;
  description?: string;
  tags?: string[];
  pricing?: { model?: string; rate?: string };
  website?: string;
};

export function AgentCard({
  chainId,
  address,
  meta,
  onCreateTask,
  onView,
}: {
  chainId?: number;
  address: string;
  meta?: AgentMeta | null;
  onCreateTask: (agent: string, meta?: AgentMeta | null) => void;
  onView: (agent: string, meta?: AgentMeta | null) => void;
}) {
  return (
    <Card className="group transition hover:border-white/15">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="truncate">{meta?.name || short(address)}</CardTitle>
            <CardDescription className="mt-1 line-clamp-2">
              {meta?.description || "Autonomous agent registered on Railent."}
            </CardDescription>
          </div>
          <div className="flex items-center gap-1">
            <CopyButton value={address} />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {(meta?.tags || []).slice(0, 4).map((t) => (
            <Badge key={t} className="bg-white/5 text-white/75">
              {t}
            </Badge>
          ))}
          {meta?.pricing?.rate ? (
            <Badge className="border-railent/30 bg-railent/15 text-white">{meta.pricing.rate}</Badge>
          ) : null}
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex items-center justify-between">
          <ExternalLink href={addrUrl(chainId, address)} label="View on explorer" className="text-sm" />
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => onView(address, meta)}>
              Profile
            </Button>
            <Button size="sm" onClick={() => onCreateTask(address, meta)}>
              Create task
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
