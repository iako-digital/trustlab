"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Claim } from "@/lib/types";

/**
 * Public data layer. Reads published claims from /api/claims and sends
 * submissions to the same endpoint; nothing is persisted in the browser.
 * Admin data lives in components/admin (it needs an authenticated session).
 */

export interface NewSubmission {
  title: string;
  claim: string;
  category: Claim["category"];
  sourceLang: Claim["sourceLang"];
  submissionType: Claim["submissionType"];
  sourceUrl?: string;
  notes?: string;
  /** Honeypot: must stay empty. */
  website?: string;
}

interface StoreValue {
  /** Published claims only. */
  claims: Claim[];
  ready: boolean;
  loadFailed: boolean;
  refresh: () => Promise<void>;
  /** Resolves true when the server accepted the submission. */
  addSubmission: (input: NewSubmission) => Promise<boolean>;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [ready, setReady] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/claims", { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      const json = (await res.json()) as { claims: Claim[] };
      setClaims(json.claims);
      setLoadFailed(false);
    } catch {
      setLoadFailed(true);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addSubmission = useCallback(async (input: NewSubmission) => {
    try {
      const res = await fetch("/api/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      return res.ok;
    } catch {
      return false;
    }
  }, []);

  const value = useMemo(
    () => ({ claims, ready, loadFailed, refresh, addSubmission }),
    [claims, ready, loadFailed, refresh, addSubmission],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
