import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createServiceSupabase } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import { parseSuggestionEdit } from "@/lib/validation";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Admin decision on an AI suggestion. Body: { decision: "approve" | "edit" | "reject", ... }.
 * The change and its audit_log rows are written by `review_ai_suggestion`
 * in one transaction; approving also publishes the claim.
 */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const { id } = await ctx.params;
  if (!UUID.test(id)) return NextResponse.json({ error: "Invalid id." }, { status: 400 });

  if (!rateLimit(`admin-action:${admin.userId}`, 60, 60 * 1000).ok) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Request body must be JSON." }, { status: 400 });
  }

  const decision = body.decision;
  if (decision !== "approve" && decision !== "edit" && decision !== "reject") {
    return NextResponse.json({ error: "Unknown decision." }, { status: 400 });
  }

  let patch: Record<string, unknown> = {};
  if (decision === "edit") {
    const parsed = parseSuggestionEdit(body);
    if (!parsed.ok) return NextResponse.json({ error: `Invalid field: ${parsed.error}` }, { status: 400 });
    patch = parsed.value as unknown as Record<string, unknown>;
  }

  const { data, error } = await createServiceSupabase().rpc("review_ai_suggestion", {
    p_id: id,
    p_decision: decision,
    p_patch: patch,
    p_actor: admin.userId,
  });

  if (error) {
    if (error.code === "P0002") return NextResponse.json({ error: "Suggestion not found." }, { status: 404 });
    if (error.message?.includes("invalid_state")) {
      return NextResponse.json({ error: "Suggestion or claim is not in a valid state." }, { status: 409 });
    }
    if (error.message?.includes("incomplete_suggestion")) {
      return NextResponse.json({ error: "Suggestion is incomplete.", code: "incomplete" }, { status: 422 });
    }
    return NextResponse.json({ error: "Action failed." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, status: (data as { status: string }).status });
}
