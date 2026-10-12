"use client";

import { useCallback, useEffect, useState } from "react";
import type { AiSuggestion, Claim, Locale, Verdict } from "@/lib/types";

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
  code?: "incomplete" | "not_configured" | "rate_limited";
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
      if (!res.ok || !sres.ok) throw new Error(String(res.status));
      const json = (await res.json()) as { claims: Claim[] };
      const sjson = (await sres.json()) as { suggestions: AiSuggestion[] };
      setClaims(json.claims);
      setSuggestions(sjson.suggestions);
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
    async (url: string, body?: unknown): Promise<ActResult> => {
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: body === undefined ? undefined : JSON.stringify(body),
        });
        if (res.ok) {
          await refresh();
          return { ok: true };
        }
        const j = (await res.json().catch(() => ({}))) as { code?: string };
        if (res.status === 429) return { ok: false, code: "rate_limited" };
        if (j.code === "incomplete" || j.code === "not_configured") return { ok: false, code: j.code };
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

  return { claims, suggestions, loading, loadFailed, refresh, act, decide, generate };
}
