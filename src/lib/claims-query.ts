import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { CLAIM_COLUMNS, CLAIM_COLUMNS_FULL, CLAIM_COLUMNS_WITH_TAGS, type ClaimRow } from "@/lib/claims-mapper";

/**
 * Loads claim rows. Selects `tags` / `cover_image_url` when the columns exist and retries without it
 * on "undefined column" (Postgres 42703), so the site keeps working on a database
 * where migrations 0004 / 0005 have not been applied yet.
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

  // Newest schema first; step down while columns are missing.
  let res = await run(CLAIM_COLUMNS_FULL);
  if (res.error?.code === "42703") res = await run(CLAIM_COLUMNS_WITH_TAGS);
  if (res.error?.code === "42703") res = await run(CLAIM_COLUMNS);
  return res.error || !res.data ? { rows: null, failed: true } : { rows: res.data, failed: false };
}
