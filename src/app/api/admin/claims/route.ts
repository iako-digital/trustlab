import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createServiceSupabase } from "@/lib/supabase/server";
import { CLAIM_COLUMNS, rowToClaim, type ClaimRow } from "@/lib/claims-mapper";

export const dynamic = "force-dynamic";

/** Admin: every claim in every state. */
export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const { data, error } = await createServiceSupabase()
    .from("claims")
    .select(CLAIM_COLUMNS)
    .order("submitted_at", { ascending: false })
    .limit(1000)
    .returns<ClaimRow[]>();

  if (error) return NextResponse.json({ error: "Could not load claims." }, { status: 500 });
  return NextResponse.json(
    { claims: data.map((r) => rowToClaim(r, { admin: true })) },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
