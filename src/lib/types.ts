export type Locale = "ka" | "hy" | "en";
export const LOCALES: Locale[] = ["ka", "hy", "en"];

export type Verdict = "fake" | "manipulative" | "true";
export type ClaimStatus = Verdict | "pending";

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
  category: Category;
  /** Language the source content was originally in. */
  sourceLang: Locale;
  /** What the submitter sent. */
  submissionType: SubmissionType;
  /** URL or image URL when relevant. */
  sourceUrl?: string;
  sources: string[];
  verifiedBy?: string;
  submittedAt: string; // ISO date
  verifiedAt?: string; // ISO date
}
