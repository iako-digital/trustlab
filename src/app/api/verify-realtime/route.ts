import { NextResponse, type NextRequest } from "next/server";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { verifyRealtime } from "@/lib/ai-realtime";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_CHARS = 1500;
const NO_STORE = { "Cache-Control": "no-store" };

/**
 * Public, rate-limited live check used by the browser extension when no published
 * claim matches. The result is an AI signal, not a TrustLab editorial verdict, and
 * nothing is stored. Gemini quota is shared, so per-IP and global caps apply.
 */
export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  if (!rateLimit(`verify-rt:${ip}`, 6, 10 * 60 * 1000).ok || !rateLimit("verify-rt:global", 300, 60 * 60 * 1000).ok) {
    return NextResponse.json(
      { error: "Too many requests. Try again later.", code: "rate_limited" },
      { status: 429, headers: { ...NO_STORE, "Retry-After": "600" } },
    );
  }

  let b: Record<string, unknown>;
  try {
    b = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Request body must be JSON." }, { status: 400, headers: NO_STORE });
  }
  const text = typeof b?.text === "string" ? b.text.trim().slice(0, MAX_CHARS) : "";
  if (text.length < 15) {
    return NextResponse.json({ error: "Text is too short to check." }, { status: 400, headers: NO_STORE });
  }
  const language = typeof b.language === "string" && ["ka", "hy", "en"].includes(b.language) ? b.language : undefined;

  const out = await verifyRealtime(text, language);
  if (!out.ok) {
    return out.error === "not_configured"
      ? NextResponse.json({ error: "AI is not configured.", code: "not_configured" }, { status: 503, headers: NO_STORE })
      : NextResponse.json({ error: "AI request failed." }, { status: 502, headers: NO_STORE });
  }
  return NextResponse.json(out.value, { headers: NO_STORE });
}
