import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createServiceSupabase } from "@/lib/supabase/server";
import { rowToClaim } from "@/lib/claims-mapper";
import { loadClaimRows } from "@/lib/claims-query";
import { rateLimit } from "@/lib/rate-limit";
import { parseClaimInput } from "@/lib/validation";

export const dynamic = "force-dynamic";

/** Admin: every claim in every state. */
export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Server is not configured." }, { status: 503 });
  }

  const { rows, failed } = await loadClaimRows(createServiceSupabase(), {
    limit: 1000,
    orderBy: "submitted_at",
  });
  if (failed || !rows) return NextResponse.json({ error: "Could not load claims." }, { status: 500 });
  return NextResponse.json(
    { claims: rows.map((r) => rowToClaim(r, { admin: true })) },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

/** Admin: create a claim (pending without a verdict, published with one). Audited in SQL. */
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  if (!rateLimit(`admin-action:${admin.userId}`, 60, 60 * 1000).ok) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Request body must be JSON." }, { status: 400 });
  }
  const parsed = parseClaimInput(body);
  if (!parsed.ok) return NextResponse.json({ error: `Invalid field: ${parsed.error}` }, { status: 400 });

  const { data, error } = await createServiceSupabase().rpc("admin_create_claim", {
    p_data: parsed.value,
    p_actor: admin.userId,
  });
  if (error) {
    // 42883 = function missing: migration 0004 has not been applied.
    const code = error.code === "42883" || error.code === "PGRST202" ? "migration_missing" : undefined;
    return NextResponse.json({ error: "Could not create claim.", code }, { status: 500 });
  }
  return NextResponse.json({ ok: true, id: (data as { id: string }).id }, { status: 201 });
}
