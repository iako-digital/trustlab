import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createServiceSupabase } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import { generateSuggestion } from "@/lib/ai-suggest";
import type { Locale } from "@/lib/types";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Admin: ask the AI for a suggestion on a pending claim. It stays pending until a human decides. */
export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const { id } = await ctx.params;
  if (!UUID.test(id)) return NextResponse.json({ error: "Invalid id." }, { status: 400 });

  const limited = rateLimit(`analyze:${admin.userId}`, 10, 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many requests." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } },
    );
  }

  const supabase = createServiceSupabase();
  const { data: claim } = await supabase
    .from("claims")
    .select("title,claim,notes,source_url,source_lang,state")
    .eq("id", id)
    .maybeSingle();
  if (!claim) return NextResponse.json({ error: "Claim not found." }, { status: 404 });
  if (claim.state !== "pending") {
    return NextResponse.json({ error: "Claim is not pending." }, { status: 409 });
  }

  const lang = claim.source_lang as Locale;
  const text = [
    `Source language: ${lang}`,
    `Title: ${claim.title?.[lang] ?? ""}`,
    `Claim: ${claim.claim?.[lang] ?? ""}`,
    claim.source_url ? `URL: ${claim.source_url}` : "",
    claim.notes ? `Submitter notes: ${claim.notes}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const gen = await generateSuggestion(text);
  if (!gen.ok) {
    return gen.error === "not_configured"
      ? NextResponse.json({ error: "AI is not configured.", code: "not_configured" }, { status: 503 })
      : NextResponse.json({ error: "AI request failed." }, { status: 502 });
  }

  const { error } = await supabase.rpc("create_ai_suggestion", {
    p_claim: id,
    p_verdict: gen.value.verdict,
    p_summary: gen.value.evidenceSummary,
    p_translation: gen.value.translation,
    p_model: gen.value.model,
    p_actor: admin.userId,
  });
  if (error) {
    if (error.message?.includes("pending_exists")) {
      return NextResponse.json({ error: "A suggestion is already pending." }, { status: 409 });
    }
    if (error.message?.includes("invalid_state")) {
      return NextResponse.json({ error: "Claim is not pending." }, { status: 409 });
    }
    return NextResponse.json({ error: "Could not save suggestion." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
