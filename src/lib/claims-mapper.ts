import type { Claim, ClaimState, Localized } from "@/lib/types";

/** Row shape returned by `select` on public.claims (+ joined verifier name). */
export interface ClaimRow {
  id: string;
  title: Localized;
  claim: Localized;
  explanation: Localized;
  state: ClaimState;
  verdict: "fake" | "manipulative" | "true" | null;
  category: Claim["category"];
  source_lang: Claim["sourceLang"];
  submission_type: Claim["submissionType"];
  source_url: string | null;
  sources: string[];
  tags?: string[] | null;
  cover_image_url?: string | null;
  verified_label: string | null;
  verified_at: string | null;
  reject_reason: string | null;
  rejected_at: string | null;
  submitted_at: string;
  verifier?: { display_name: string } | null;
}

export function rowToClaim(r: ClaimRow, opts: { admin?: boolean } = {}): Claim {
  return {
    id: r.id,
    title: r.title,
    claim: r.claim,
    explanation: r.explanation,
    status: r.verdict ?? "pending",
    state: r.state,
    category: r.category,
    sourceLang: r.source_lang,
    submissionType: r.submission_type,
    sourceUrl: r.source_url ?? undefined,
    sources: r.sources ?? [],
    tags: r.tags ?? [],
    coverImageUrl: r.cover_image_url ?? undefined,
    verifiedBy: r.verifier?.display_name ?? r.verified_label ?? undefined,
    submittedAt: r.submitted_at,
    verifiedAt: r.verified_at ?? undefined,
    // Rejection details are admin-only.
    ...(opts.admin
      ? { rejectReason: r.reject_reason ?? undefined, rejectedAt: r.rejected_at ?? undefined }
      : {}),
  };
}

/**
 * Columns to select. `verifier` joins admin_users for the display name.
 * NOTE: admin_users is RLS-protected (own row only), so the public anon client
 * cannot see it; the public API therefore uses the service client for the join
 * and exposes only the display name.
 */
const BASE_COLUMNS =
  "id,title,claim,explanation,state,verdict,category,source_lang,submission_type,source_url,sources,verified_label,verified_at,reject_reason,rejected_at,submitted_at,verifier:admin_users!claims_verified_by_fkey(display_name)";

export const CLAIM_COLUMNS = BASE_COLUMNS;
/** Includes `tags` (migration 0004). Use loadClaimRows() so older databases keep working. */
export const CLAIM_COLUMNS_WITH_TAGS = BASE_COLUMNS.replace(",sources,",",sources,tags,");
/** Includes `tags` and `cover_image_url` (migration 0005). */
export const CLAIM_COLUMNS_FULL = BASE_COLUMNS.replace(",sources,",",sources,tags,cover_image_url,");
