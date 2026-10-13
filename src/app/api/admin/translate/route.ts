import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { translateClaim } from "@/lib/ai-admin-tools";
import { LOCALES, type Locale } from "@/lib/types";

export const dynamic = "force-dynamic";

const cut = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** Admin: translate the claim fields into the other two languages. Returns text only; nothing is saved. */
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const limited = rateLimit(`ai-translate:${admin.userId}`, 10, 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many requests." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } },
    );
  }

  let b: Record<string, unknown>;
  try {
    b = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Request body must be JSON." }, { status: 400 });
  }
  const from = b?.from as Locale;
  if (!LOCALES.includes(from)) return NextResponse.json({ error: "Invalid language." }, { status: 400 });
  const input = {
    from,
    title: cut(b.title, 300),
    claim: cut(b.claim, 5000),
    explanation: cut(b.explanation, 20000),
  };
  if (!input.title || !input.claim) {
    return NextResponse.json({ error: "Title and claim are required." }, { status: 400 });
  }

  const out = await translateClaim(input);
  if (!out.ok) {
    return out.error === "not_configured"
      ? NextResponse.json({ error: "AI is not configured.", code: "not_configured" }, { status: 503 })
      : NextResponse.json({ error: "AI request failed." }, { status: 502 });
  }
  return NextResponse.json({ translations: out.value }, { headers: { "Cache-Control": "private, no-store" } });
}
