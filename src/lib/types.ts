export type Locale = "ka" | "hy" | "en";
export const LOCALES: Locale[] = ["ka", "hy", "en"];

export type Verdict = "fake" | "manipulative" | "true";
export type ClaimStatus = Verdict | "pending";

/** Lifecycle of a submission. `status` is the verdict (or "pending"). */
export type ClaimState = "pending" | "published" | "rejected";

export type Category = "peace" | "media" | "history" | "society";
export const CATEGORIES: Category[] = ["peace", "media", "history", "society"];

/** A localized string: text for each supported language. */
export type Localized = Record<Locale, string>;

export type SubmissionType = "link" | "text" | "image";

export interface Claim {
  id: string;
  /** Short headline of the claim, per language. */
  title: Localized;
  /** The claim as circulated, per language. */
  claim: Localized;
  /** Editor explanation / fact-check, per language. Empty while pending. */
  explanation: Localized;
  status: ClaimStatus;
  /** Lifecycle state; rejected claims are only ever returned to admins. */
  state?: ClaimState;
  category: Category;
  /** Language the source content was originally in. */
  sourceLang: Locale;
  /** What the submitter sent. */
  submissionType: SubmissionType;
  /** URL or image URL when relevant. */
  sourceUrl?: string;
  sources: string[];
  /** Free-form topic tags (lowercase). */
  tags?: string[];
  verifiedBy?: string;
  submittedAt: string; // ISO date
  verifiedAt?: string; // ISO date
  /** Admin-only. */
  rejectReason?: string;
  rejectedAt?: string; // ISO date
}

export type AiSuggestionStatus = "pending" | "approved" | "rejected";

/** An AI proposal for a pending claim; only an admin decision makes it public. */
export interface AiSuggestion {
  id: string;
  claimId: string;
  suggestedVerdict: Verdict;
  evidenceSummary: string;
  translation: { title: Localized; explanation: Localized };
  status: AiSuggestionStatus;
  /** An admin changed the proposal before deciding. */
  edited: boolean;
  model?: string;
  createdAt: string; // ISO date
}
