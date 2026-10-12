import type { AiSuggestion, AiSuggestionStatus, Localized, Verdict } from "@/lib/types";

export interface AiSuggestionRow {
  id: string;
  claim_id: string;
  suggested_verdict: Verdict;
  evidence_summary: string;
  translation: { title?: Partial<Localized>; explanation?: Partial<Localized> } | null;
  status: AiSuggestionStatus;
  edited: boolean;
  model: string | null;
  created_at: string;
}

export const AI_SUGGESTION_COLUMNS =
  "id,claim_id,suggested_verdict,evidence_summary,translation,status,edited,model,created_at";

function loc(v: Partial<Localized> | undefined): Localized {
  return { ka: v?.ka ?? "", hy: v?.hy ?? "", en: v?.en ?? "" };
}

export function rowToSuggestion(r: AiSuggestionRow): AiSuggestion {
  return {
    id: r.id,
    claimId: r.claim_id,
    suggestedVerdict: r.suggested_verdict,
    evidenceSummary: r.evidence_summary,
    translation: { title: loc(r.translation?.title), explanation: loc(r.translation?.explanation) },
    status: r.status,
    edited: r.edited,
    model: r.model ?? undefined,
    createdAt: r.created_at,
  };
}
