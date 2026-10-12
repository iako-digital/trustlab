import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createServiceSupabase } from "@/lib/supabase/server";
import {
  AI_SUGGESTION_COLUMNS,
  rowToSuggestion,
  type AiSuggestionRow,
} from "@/lib/ai-suggestion-mapper";

export const dynamic = "force-dynamic";

/** Admin: every open (pending) AI suggestion. */
export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const { data, error } = await createServiceSupabase()
    .from("ai_suggestions")
    .select(AI_SUGGESTION_COLUMNS)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1000)
    .returns<AiSuggestionRow[]>();

  if (error) return NextResponse.json({ error: "Could not load suggestions." }, { status: 500 });
  return NextResponse.json(
    { suggestions: data.map(rowToSuggestion) },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
