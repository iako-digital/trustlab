"use client";

import { useCallback, useEffect, useState } from "react";
import type { AiSuggestion, Category, Claim, Locale, Verdict } from "@/lib/types";

export type AdminAction =
  | {
      action: "publish";
      verdict: Verdict;
      title: Record<Locale, string>;
      explanation: Record<Locale, string>;
      sources: string[];
    }
  | { action: "reject"; reason: string }
  | { action: "restore" };

export type SuggestionDecision =
  | { decision: "approve" }
  | { decision: "reject" }
  | {
      decision: "edit";
      verdict: Verdict;
      evidenceSummary: string;
      translation: { title: Record<Locale, string>; explanation: Record<Locale, string> };
    };

/** `code` carries the server's reason when it is one the UI explains. */
export interface ActResult {
  ok: boolean;
  code?: "incomplete" | "not_configured" | "rate_limited" | "invalid" | "migration_missing";
}

/** What the create/edit form sends. `verdict: null` saves (or keeps) the claim as pending. */
export interface ClaimFormValue {
  title: Record<Locale, string>;
  claim: Record<Locale, string>;
  explanation: Record<Locale, string>;
  category: Category;
  sourceLang: Locale;
  sourceUrl: string;
  sources: string[];
  tags: string[];
  verdict: Verdict | null;
}

/** Loads every claim (all states) for the admin UI and performs admin actions. */
export function useAdminClaims() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<AiSuggestion[]>([]);
  const [loadFailed, setLoadFailed] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const [res, sres] = await Promise.all([
        fetch("/api/admin/claims", { cache: "no-store" }),
        fetch("/api/admin/suggestions", { cache: "no-store" }),
      ]);
      if (!res.ok) throw new Error(String(res.status));
      const json = (await res.json()) as { claims: Claim[] };
      setClaims(json.claims);
      // AI suggestions are optional: if that endpoint fails (e.g. migration 0003
      // not applied yet) the queue must still work without them.
      const sjson = sres.ok ? ((await sres.json()) as { suggestions: AiSuggestion[] }) : null;
      setSuggestions(sjson?.suggestions ?? []);
      setLoadFailed(false);
    } catch {
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  /** Resolves true on success; the list is reloaded from the server afterwards. */
  const act = useCallback(
    async (id: string, body: AdminAction): Promise<boolean> => {
      try {
        const res = await fetch(`/api/admin/claims/${id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (res.ok) await refresh();
        return res.ok;
      } catch {
        return false;
      }
    },
    [refresh],
  );

  const post = useCallback(
    async (url: string, body?: unknown, method = "POST"): Promise<ActResult> => {
      try {
        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: body === undefined ? undefined : JSON.stringify(body),
        });
        if (res.ok) {
          await refresh();
          return { ok: true };
        }
        const j = (await res.json().catch(() => ({}))) as { code?: string };
        if (res.status === 429) return { ok: false, code: "rate_limited" };
        if (res.status === 400) return { ok: false, code: "invalid" };
        if (j.code === "incomplete" || j.code === "not_configured" || j.code === "migration_missing") {
          return { ok: false, code: j.code };
        }
        return { ok: false };
      } catch {
        return { ok: false };
      }
    },
    [refresh],
  );

  const decide = useCallback(
    (id: string, body: SuggestionDecision) => post(`/api/admin/suggestions/${id}`, body),
    [post],
  );
  const generate = useCallback(
    (claimId: string) => post(`/api/admin/claims/${claimId}/suggest`),
    [post],
  );

  const createClaim = useCallback((v: ClaimFormValue) => post("/api/admin/claims", v), [post]);
  const editClaim = useCallback(
    (id: string, v: ClaimFormValue) => post(`/api/admin/claims/${id}`, v, "PUT"),
    [post],
  );
  const removeClaim = useCallback(
    (id: string) => post(`/api/admin/claims/${id}`, undefined, "DELETE"),
    [post],
  );

  return {
    claims,
    suggestions,
    loading,
    loadFailed,
    refresh,
    act,
    decide,
    generate,
    createClaim,
    editClaim,
    removeClaim,
  };
}
