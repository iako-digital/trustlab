import { NextResponse, type NextRequest } from "next/server";
import { createServiceSupabase } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { CLAIM_COLUMNS, rowToClaim, type ClaimRow } from "@/lib/claims-mapper";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { parseSubmission } from "@/lib/validation";

export const dynamic = "force-dynamic";

const NOT_CONFIGURED = NextResponse.json({ error: "Server is not configured." }, { status: 503 });

/** Public feed: published claims only. */
export async function GET() {
  if (!isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) return NOT_CONFIGURED;

  // Service client is used only for the verifier-name join; the state filter
  // is explicit and rejection details are never mapped for the public.
  const { data, error } = await createServiceSupabase()
    .from("claims")
    .select(CLAIM_COLUMNS)
    .eq("state", "published")
    .order("verified_at", { ascending: false })
    .limit(500)
    .returns<ClaimRow[]>();

  if (error) return NextResponse.json({ error: "Could not load claims." }, { status: 500 });

  return NextResponse.json(
    { claims: data.map((r) => rowToClaim(r)) },
    { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" } },
  );
}

/** Public submission. Always lands as `pending`; only an admin can publish. */
export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) return NOT_CONFIGURED;

  const ip = clientIp(req);
  const limited = rateLimit(`submit:${ip}`, 5, 10 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many submissions. Try again later." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Request body must be JSON." }, { status: 400 });
  }

  // Honeypot: real users never fill this hidden field. Pretend success to bots.
  if (typeof (body as Record<string, unknown> | null)?.website === "string" &&
      ((body as Record<string, unknown>).website as string).length > 0) {
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  const parsed = parseSubmission(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: `Invalid field: ${parsed.error}` }, { status: 400 });
  }
  const v = parsed.value;

  // The submitter writes in one language; the editor translates later.
  const same = { ka: v.title, hy: v.title, en: v.title };
  const sameClaim = { ka: v.claim, hy: v.claim, en: v.claim };

  const supabase = createServiceSupabase();
  const { data, error } = await supabase
    .from("claims")
    .insert({
      title: same,
      claim: sameClaim,
      state: "pending",
      category: v.category,
      source_lang: v.sourceLang,
      submission_type: v.submissionType,
      source_url: v.sourceUrl,
      notes: v.notes,
    })
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Could not save submission." }, { status: 500 });
  }

  // Best-effort log; not an admin action, so source = system and no actor.
  await supabase.from("audit_log").insert({
    action: "claim.submitted",
    entity_type: "claim",
    entity_id: data.id,
    new_value: { category: v.category, source_lang: v.sourceLang, submission_type: v.submissionType },
    source: "system",
  });

  return NextResponse.json({ ok: true, id: data.id }, { status: 201 });
}
