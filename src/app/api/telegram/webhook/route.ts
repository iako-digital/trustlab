import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createServiceSupabase } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { rowToClaim } from "@/lib/claims-mapper";
import { loadClaimRows } from "@/lib/claims-query";
import { buildClaimIndex, findClaimMatch, type ClaimIndexEntry } from "@/lib/claim-match";
import { detectLang } from "@/lib/detect-lang";
import { rateLimit } from "@/lib/rate-limit";
import { verifyRealtime } from "@/lib/ai-realtime";
import { SITE_URL } from "@/lib/social";
import { BOT_TEXT, VERDICT_TEXT, html, sendTelegramMessage } from "@/lib/telegram";
import type { Locale } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_CHARS = 1500;
const MIN_CHARS = 15;

interface TelegramUpdate {
  message?: { chat?: { id?: number; type?: string }; text?: string; from?: { language_code?: string } };
}

let indexCache: { at: number; index: ClaimIndexEntry[] } | null = null;

/** Published claims, cached for 5 minutes per server instance. */
async function claimIndex(): Promise<ClaimIndexEntry[]> {
  if (indexCache && Date.now() - indexCache.at < 5 * 60 * 1000) return indexCache.index;
  if (!isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) return [];
  const { rows, failed } = await loadClaimRows(createServiceSupabase(), {
    publishedOnly: true,
    limit: 500,
    orderBy: "verified_at",
  });
  if (failed || !rows) return indexCache?.index ?? [];
  const index = buildClaimIndex(rows.map((r) => rowToClaim(r)));
  indexCache = { at: Date.now(), index };
  return index;
}

function secretOk(req: NextRequest, secret: string): boolean {
  const given = Buffer.from(req.headers.get("x-telegram-bot-api-secret-token") ?? "");
  const want = Buffer.from(secret);
  return given.length === want.length && timingSafeEqual(given, want);
}

/**
 * Telegram Bot webhook. Register it with scripts/set-telegram-webhook.mjs, which sets
 * the same secret that is checked here. Every authenticated update answers 200 so
 * Telegram does not retry; failures are reported to the user in the chat instead.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret || !process.env.TELEGRAM_BOT_TOKEN) {
    return NextResponse.json({ error: "Bot is not configured." }, { status: 503 });
  }
  if (!secretOk(req, secret)) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  let update: TelegramUpdate;
  try {
    update = (await req.json()) as TelegramUpdate;
  } catch {
    return NextResponse.json({ ok: true });
  }
  const chatId = update.message?.chat?.id;
  const text = update.message?.text?.trim();
  if (typeof chatId !== "number" || !text) return NextResponse.json({ ok: true }); // stickers, photos, edits…

  const hint = update.message?.from?.language_code?.slice(0, 2);

  // Commands: /start (also "/start payload" and "/start@botname").
  if (/^\/start(@\w+)?(\s|$)/i.test(text) || /^\/help(@\w+)?(\s|$)/i.test(text)) {
    const lang: Locale = hint === "ka" || hint === "hy" ? hint : "en";
    await sendTelegramMessage(chatId, BOT_TEXT.start[lang]);
    return NextResponse.json({ ok: true });
  }
  if (text.startsWith("/")) return NextResponse.json({ ok: true });

  const lang = detectLang(text);
  if (text.length < MIN_CHARS) {
    await sendTelegramMessage(chatId, BOT_TEXT.tooShort[lang]);
    return NextResponse.json({ ok: true });
  }
  if (!rateLimit(`tg:${chatId}`, 6, 10 * 60 * 1000).ok) {
    await sendTelegramMessage(chatId, BOT_TEXT.rateLimited[lang]);
    return NextResponse.json({ ok: true });
  }
  const claim = text.slice(0, MAX_CHARS);

  // 1. Local database of verified claims.
  const match = findClaimMatch(await claimIndex(), claim);
  if (match) {
    const verdict = VERDICT_TEXT[match.status.toUpperCase()]?.[lang] ?? match.status;
    const reply = [
      BOT_TEXT.matchHeader[lang],
      `<b>${html.esc(match.title[lang] || match.title.en)}</b>`,
      `${BOT_TEXT.verdictLabel[lang]}: ${html.esc(verdict)}`,
      html.link(`${SITE_URL}/claim/${match.id}`, BOT_TEXT.fullCheck[lang]),
    ].join("\n\n");
    await sendTelegramMessage(chatId, reply);
    return NextResponse.json({ ok: true });
  }

  // 2. Live AI check: search (GEMINI_SEARCH_KEY) then verdict (GEMINI_VERIFY_KEY).
  if (!rateLimit("verify-rt:global", 300, 60 * 60 * 1000).ok) {
    await sendTelegramMessage(chatId, BOT_TEXT.rateLimited[lang]);
    return NextResponse.json({ ok: true });
  }
  await sendTelegramMessage(chatId, BOT_TEXT.checking[lang]);
  const out = await verifyRealtime(claim, lang);
  if (!out.ok) {
    await sendTelegramMessage(chatId, BOT_TEXT.unavailable[lang]);
    return NextResponse.json({ ok: true });
  }

  const { verdict, summary, sources, grounded } = out.value;
  const parts = [
    BOT_TEXT.aiHeader[lang],
    `${BOT_TEXT.verdictLabel[lang]}: <b>${html.esc(VERDICT_TEXT[verdict][lang])}</b>`,
  ];
  if (summary) parts.push(html.esc(summary));
  if (sources.length) {
    parts.push(
      `${BOT_TEXT.sources[lang]}:\n${sources.map((s, i) => `${i + 1}. ${html.link(s.url, s.title)}`).join("\n")}`,
    );
  }
  if (!grounded) parts.push(`<i>${html.esc(BOT_TEXT.ungrounded[lang])}</i>`);
  parts.push(`<i>${html.esc(BOT_TEXT.aiNote[lang])}</i>`);
  await sendTelegramMessage(chatId, parts.join("\n\n"));
  return NextResponse.json({ ok: true });
}
