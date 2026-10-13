import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { SITE_URL } from "@/lib/social";

export const dynamic = "force-dynamic";

/**
 * Admin-only: registers `${SITE_URL}/api/telegram/webhook` with Telegram, using the
 * same secret the webhook checks. Idempotent and always the fixed URL, so a GET
 * from the signed-in admin is enough (open it in the browser after deploying).
 */
async function register() {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!token || !secret) {
    return NextResponse.json(
      { ok: false, error: "Set TELEGRAM_BOT_TOKEN and TELEGRAM_WEBHOOK_SECRET first." },
      { status: 503 },
    );
  }
  if (!/^[A-Za-z0-9_-]{16,256}$/.test(secret)) {
    return NextResponse.json(
      { ok: false, error: "TELEGRAM_WEBHOOK_SECRET must be 16-256 characters of A-Z a-z 0-9 _ -." },
      { status: 500 },
    );
  }

  const url = `${SITE_URL}/api/telegram/webhook`;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, secret_token: secret, allowed_updates: ["message"] }),
      signal: AbortSignal.timeout(10_000),
    });
    const j = (await res.json().catch(() => ({}))) as { ok?: boolean; description?: string };
    return NextResponse.json(
      { ok: Boolean(j.ok), webhook: url, telegram: j.description ?? null },
      { status: j.ok ? 200 : 502, headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json({ ok: false, error: "Could not reach Telegram." }, { status: 502 });
  }
}

export const GET = register;
export const POST = register;
