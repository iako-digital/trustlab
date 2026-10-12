import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { CLAIM_COLUMNS, CLAIM_COLUMNS_WITH_TAGS, type ClaimRow } from "@/lib/claims-mapper";

/**
 * Loads claim rows. Selects `tags` when the column exists and retries without it
 * on "undefined column" (Postgres 42703), so the site keeps working on a database
 * where migration 0004 has not been applied yet.
 */
export async function loadClaimRows(
  supabase: SupabaseClient,
  opts: { publishedOnly?: boolean; limit: number; orderBy: "verified_at" | "submitted_at" },
): Promise<{ rows: ClaimRow[] | null; failed: boolean }> {
  const run = async (columns: string) => {
    let q = supabase.from("claims").select(columns);
    if (opts.publishedOnly) q = q.eq("state", "published");
    return q
      .order(opts.orderBy, { ascending: false })
      .limit(opts.limit)
      .returns<ClaimRow[]>();
  };

  let res = await run(CLAIM_COLUMNS_WITH_TAGS);
  if (res.error?.code === "42703") res = await run(CLAIM_COLUMNS);
  return res.error || !res.data ? { rows: null, failed: true } : { rows: res.data, failed: false };
}
