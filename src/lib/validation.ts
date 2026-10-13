import {
  CATEGORIES,
  LOCALES,
  type Category,
  type Locale,
  type SubmissionType,
  type Verdict,
} from "@/lib/types";

export const LIMITS = {
  title: 300,
  claim: 5000,
  notes: 2000,
  url: 2048,
  reason: 1000,
  explanation: 20000,
  sources: 20,
};

const SUBMISSION_TYPES: SubmissionType[] = ["link", "text", "image"];
const VERDICTS: Verdict[] = ["fake", "manipulative", "true"];

/** Only http(s) URLs are accepted; blocks javascript:, data:, file: etc. */
export function normalizeHttpUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const v = value.trim();
  if (!v || v.length > LIMITS.url) return null;
  try {
    const u = new URL(v);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
}

function str(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const v = value.trim();
  return v.length > 0 && v.length <= max ? v : null;
}

export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export interface SubmissionInput {
  title: string;
  claim: string;
  category: Category;
  sourceLang: Locale;
  submissionType: SubmissionType;
  sourceUrl: string | null;
  notes: string | null;
}

export function parseSubmission(body: unknown): Result<SubmissionInput> {
  if (!body || typeof body !== "object") return { ok: false, error: "Invalid body." };
  const b = body as Record<string, unknown>;

  const title = str(b.title, LIMITS.title);
  if (!title) return { ok: false, error: "title" };

  const submissionType = b.submissionType as SubmissionType;
  if (!SUBMISSION_TYPES.includes(submissionType)) return { ok: false, error: "submissionType" };

  const category = b.category as Category;
  if (!CATEGORIES.includes(category)) return { ok: false, error: "category" };

  const sourceLang = b.sourceLang as Locale;
  if (!LOCALES.includes(sourceLang)) return { ok: false, error: "sourceLang" };

  // For image submissions the form sends the title as the claim text.
  const claim = str(b.claim, LIMITS.claim);
  if (!claim) return { ok: false, error: "claim" };

  let sourceUrl: string | null = null;
  if (submissionType === "link" || submissionType === "image") {
    sourceUrl = normalizeHttpUrl(b.sourceUrl);
    if (!sourceUrl) return { ok: false, error: "sourceUrl" };
  } else if (b.sourceUrl != null && b.sourceUrl !== "") {
    sourceUrl = normalizeHttpUrl(b.sourceUrl);
    if (!sourceUrl) return { ok: false, error: "sourceUrl" };
  }

  let notes: string | null = null;
  if (b.notes != null && b.notes !== "") {
    notes = str(b.notes, LIMITS.notes);
    if (!notes) return { ok: false, error: "notes" };
  }

  return {
    ok: true,
    value: { title, claim, category, sourceLang, submissionType, sourceUrl, notes },
  };
}

export type Loc = Record<Locale, string>;

export interface PublishPatch {
  title: Loc;
  explanation: Loc;
  sources: string[];
  verdict: Verdict;
}

/**
 * Publishing rules: a verdict, a non-empty title in all 3 languages, and an
 * explanation at least in the claim's source language. Empty explanation
 * languages are allowed (the UI falls back to the source language).
 */
export function parsePublish(body: unknown, sourceLang: Locale): Result<PublishPatch> {
  if (!body || typeof body !== "object") return { ok: false, error: "Invalid body." };
  const b = body as Record<string, unknown>;

  if (!VERDICTS.includes(b.verdict as Verdict)) return { ok: false, error: "verdict" };

  const title = {} as Loc;
  const explanation = {} as Loc;
  const t = (b.title ?? {}) as Record<string, unknown>;
  const e = (b.explanation ?? {}) as Record<string, unknown>;
  for (const l of LOCALES) {
    const tv = str(t[l], LIMITS.title);
    if (!tv) return { ok: false, error: `title.${l}` };
    title[l] = tv;
    explanation[l] =
      typeof e[l] === "string" ? (e[l] as string).trim().slice(0, LIMITS.explanation) : "";
  }
  if (!explanation[sourceLang]) return { ok: false, error: `explanation.${sourceLang}` };

  const rawSources = Array.isArray(b.sources) ? b.sources : [];
  if (rawSources.length > LIMITS.sources) return { ok: false, error: "sources" };
  const sources: string[] = [];
  for (const s of rawSources) {
    const u = normalizeHttpUrl(s);
    if (!u) return { ok: false, error: "sources" };
    sources.push(u);
  }

  return { ok: true, value: { title, explanation, sources, verdict: b.verdict as Verdict } };
}

export interface SuggestionEdit {
  verdict: Verdict;
  evidenceSummary: string;
  translation: { title: Loc; explanation: Loc };
}

/**
 * Edits to an AI suggestion are drafts: titles/explanations may be blank
 * (approval re-checks completeness in SQL), but sizes and the verdict are enforced.
 */
export function parseSuggestionEdit(body: unknown): Result<SuggestionEdit> {
  if (!body || typeof body !== "object") return { ok: false, error: "Invalid body." };
  const b = body as Record<string, unknown>;
  if (!VERDICTS.includes(b.verdict as Verdict)) return { ok: false, error: "verdict" };
  if (typeof b.evidenceSummary !== "string" || b.evidenceSummary.length > 5000) {
    return { ok: false, error: "evidenceSummary" };
  }
  const tr = (b.translation ?? {}) as Record<string, unknown>;
  const out = { title: {} as Loc, explanation: {} as Loc };
  for (const key of ["title", "explanation"] as const) {
    const src = (tr[key] ?? {}) as Record<string, unknown>;
    const max = key === "title" ? LIMITS.title : LIMITS.explanation;
    for (const l of LOCALES) {
      const v = src[l];
      if (v != null && (typeof v !== "string" || v.length > max)) {
        return { ok: false, error: `translation.${key}.${l}` };
      }
      out[key][l] = typeof v === "string" ? v.trim() : "";
    }
  }
  return {
    ok: true,
    value: { verdict: b.verdict as Verdict, evidenceSummary: b.evidenceSummary.trim(), translation: out },
  };
}

export function parseReason(body: unknown): Result<string> {
  const reason = str((body as Record<string, unknown> | null)?.reason, LIMITS.reason);
  return reason ? { ok: true, value: reason } : { ok: false, error: "reason" };
}

export interface ClaimInput {
  title: Loc;
  claim: Loc;
  explanation: Loc;
  category: Category;
  sourceLang: Locale;
  sourceUrl: string | null;
  sources: string[];
  tags: string[];
  coverImageUrl: string | null;
  /** null = keep/save as pending. */
  verdict: Verdict | null;
}

/**
 * Full claim content as an admin writes it (create and edit). Titles and claim
 * text are required in all three languages; with a verdict, the explanation is
 * required at least in the source language (same rule as publishing).
 */
export function parseClaimInput(body: unknown): Result<ClaimInput> {
  if (!body || typeof body !== "object") return { ok: false, error: "Invalid body." };
  const b = body as Record<string, unknown>;

  const category = b.category as Category;
  if (!CATEGORIES.includes(category)) return { ok: false, error: "category" };
  const sourceLang = b.sourceLang as Locale;
  if (!LOCALES.includes(sourceLang)) return { ok: false, error: "sourceLang" };

  let verdict: Verdict | null = null;
  if (b.verdict != null && b.verdict !== "") {
    if (!VERDICTS.includes(b.verdict as Verdict)) return { ok: false, error: "verdict" };
    verdict = b.verdict as Verdict;
  }

  const title = {} as Loc;
  const claim = {} as Loc;
  const explanation = {} as Loc;
  const t = (b.title ?? {}) as Record<string, unknown>;
  const c = (b.claim ?? {}) as Record<string, unknown>;
  const e = (b.explanation ?? {}) as Record<string, unknown>;
  for (const l of LOCALES) {
    const tv = str(t[l], LIMITS.title);
    if (!tv) return { ok: false, error: `title.${l}` };
    title[l] = tv;
    const cv = str(c[l], LIMITS.claim);
    if (!cv) return { ok: false, error: `claim.${l}` };
    claim[l] = cv;
    explanation[l] =
      typeof e[l] === "string" ? (e[l] as string).trim().slice(0, LIMITS.explanation) : "";
  }
  if (verdict && !explanation[sourceLang]) return { ok: false, error: `explanation.${sourceLang}` };

  let sourceUrl: string | null = null;
  if (b.sourceUrl != null && b.sourceUrl !== "") {
    sourceUrl = normalizeHttpUrl(b.sourceUrl);
    if (!sourceUrl) return { ok: false, error: "sourceUrl" };
  }

  const rawSources = Array.isArray(b.sources) ? b.sources : [];
  if (rawSources.length > LIMITS.sources) return { ok: false, error: "sources" };
  const sources: string[] = [];
  for (const s of rawSources) {
    const u = normalizeHttpUrl(s);
    if (!u) return { ok: false, error: "sources" };
    sources.push(u);
  }

  let coverImageUrl: string | null = null;
  if (b.coverImageUrl != null && b.coverImageUrl !== "") {
    coverImageUrl = normalizeHttpUrl(b.coverImageUrl);
    if (!coverImageUrl) return { ok: false, error: "coverImageUrl" };
  }

  const rawTags = Array.isArray(b.tags) ? b.tags : [];
  const tags = [
    ...new Set(
      rawTags
        .filter((x): x is string => typeof x === "string")
        .map((x) => x.trim().toLowerCase())
        .filter(Boolean),
    ),
  ];
  if (tags.length > 10 || tags.some((x) => x.length > 40)) return { ok: false, error: "tags" };

  return {
    ok: true,
    value: { title, claim, explanation, category, sourceLang, sourceUrl, sources, tags, coverImageUrl, verdict },
  };
}
