import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createServiceSupabase } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import { parseClaimInput, parsePublish, parseReason } from "@/lib/validation";
import type { Locale } from "@/lib/types";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ACTIONS = { publish: "claim.publish", reject: "claim.reject", restore: "claim.restore" } as const;

/**
 * Admin decisions on a claim. Body: { action: "publish" | "reject" | "restore", ... }.
 * The state change and its audit_log row are written in ONE transaction by the
 * `admin_update_claim` SQL function.
 *
 * `source` is hard-wired to "human": until AI suggestions exist server-side,
 * a client must not be able to label its own action as AI-accepted.
 */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const { id } = await ctx.params;
  if (!UUID.test(id)) return NextResponse.json({ error: "Invalid id." }, { status: 400 });

  const limited = rateLimit(`admin-action:${admin.userId}`, 60, 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Request body must be JSON." }, { status: 400 });
  }

  const action = body.action;
  if (action !== "publish" && action !== "reject" && action !== "restore") {
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }

  const supabase = createServiceSupabase();
  let patch: Record<string, unknown> = {};

  if (action === "publish") {
    // Need the claim's source language to validate the explanation rule.
    const { data: current } = await supabase
      .from("claims")
      .select("source_lang")
      .eq("id", id)
      .maybeSingle();
    if (!current) return NextResponse.json({ error: "Claim not found." }, { status: 404 });

    const parsed = parsePublish(body, current.source_lang as Locale);
    if (!parsed.ok) {
      return NextResponse.json({ error: `Invalid field: ${parsed.error}` }, { status: 400 });
    }
    patch = parsed.value as unknown as Record<string, unknown>;
  } else if (action === "reject") {
    const parsed = parseReason(body);
    if (!parsed.ok) return NextResponse.json({ error: "Invalid field: reason" }, { status: 400 });
    patch = { reason: parsed.value };
  }

  const { data, error } = await supabase.rpc("admin_update_claim", {
    p_id: id,
    p_action: ACTIONS[action],
    p_patch: patch,
    p_actor: admin.userId,
    p_source: "human",
    p_meta: {},
  });

  if (error) {
    if (error.code === "P0002") return NextResponse.json({ error: "Claim not found." }, { status: 404 });
    if (error.message?.includes("invalid_state")) {
      return NextResponse.json({ error: "Claim is not in a valid state for this action." }, { status: 409 });
    }
    return NextResponse.json({ error: "Action failed." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, state: (data as { state: string }).state });
}

async function gate(ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return { res: admin } as const;
  const { id } = await ctx.params;
  if (!UUID.test(id)) return { res: NextResponse.json({ error: "Invalid id." }, { status: 400 }) } as const;
  if (!rateLimit(`admin-action:${admin.userId}`, 60, 60 * 1000).ok) {
    return { res: NextResponse.json({ error: "Too many requests." }, { status: 429 }) } as const;
  }
  return { admin, id } as const;
}

function rpcError(error: { code?: string; message?: string }, what: string) {
  if (error.code === "P0002") return NextResponse.json({ error: "Claim not found." }, { status: 404 });
  const code = error.code === "42883" || error.code === "PGRST202" ? "migration_missing" : undefined;
  return NextResponse.json({ error: `Could not ${what} claim.`, code }, { status: 500 });
}

/** Admin: edit a claim's content (not its lifecycle state). */
export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const g = await gate(ctx);
  if ("res" in g) return g.res;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Request body must be JSON." }, { status: 400 });
  }
  const parsed = parseClaimInput(body);
  if (!parsed.ok) return NextResponse.json({ error: `Invalid field: ${parsed.error}` }, { status: 400 });

  const { error } = await createServiceSupabase().rpc("admin_edit_claim", {
    p_id: g.id,
    p_data: parsed.value,
    p_actor: g.admin.userId,
  });
  if (error) return rpcError(error, "update");
  return NextResponse.json({ ok: true });
}

/** Admin: delete a claim for good (the full row is kept in audit_log). */
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const g = await gate(ctx);
  if ("res" in g) return g.res;

  const { error } = await createServiceSupabase().rpc("admin_delete_claim", {
    p_id: g.id,
    p_actor: g.admin.userId,
  });
  if (error) return rpcError(error, "delete");
  return NextResponse.json({ ok: true });
}
