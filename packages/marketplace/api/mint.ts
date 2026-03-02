import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ ok: false, error: "method_not_allowed" });
    }

    const allowed = (process.env.ALLOWED_ORIGINS || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const origin = (req.headers.origin as string | undefined) || "";
    // Some clients (curl) don't send Origin. In production, block by default.
    if (!origin || (allowed.length > 0 && !allowed.includes(origin))) {
      res.status(403).json({ ok: false, error: "forbidden_origin", origin });
      return;
    }

    const ATTESTOR_API_URL = process.env.ATTESTOR_API_URL;
    const MINT_API_KEY = process.env.MINT_API_KEY;

    if (!ATTESTOR_API_URL || !MINT_API_KEY) {
      return res.status(500).json({ ok: false, error: "missing_env" });
    }

    const { to, amount } = (req.body ?? {}) as { to?: string; amount?: string };

    const r = await fetch(`${ATTESTOR_API_URL.replace(/\/$/, "")}/mint`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": MINT_API_KEY,
      },
      body: JSON.stringify({ to, amount }),
    });

    const text = await r.text();
    res.status(r.status).setHeader("content-type", r.headers.get("content-type") || "application/json");
    return res.send(text);
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}
