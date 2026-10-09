"use client";

import { useCallback, useEffect, useState } from "react";
import type { Claim, Locale, Verdict } from "@/lib/types";

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

/** Loads every claim (all states) for the admin UI and performs admin actions. */
export function useAdminClaims() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/claims", { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      const json = (await res.json()) as { claims: Claim[] };
      setClaims(json.claims);
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

  return { claims, loading, loadFailed, refresh, act };
}
