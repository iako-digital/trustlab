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
import { SEED_CLAIMS } from "@/data/claims";
import type { Claim, Verdict } from "@/lib/types";
import { newId } from "@/lib/utils";

/**
 * Prototype data layer. Swap this for Supabase/Prisma later — the component
 * API (claims, addSubmission, publishClaim, rejectClaim) stays the same.
 */

const STORAGE_KEY = "mbc.claims.v1";

export interface NewSubmission {
  title: string;
  claim: string;
  category: Claim["category"];
  sourceLang: Claim["sourceLang"];
  submissionType: Claim["submissionType"];
  sourceUrl?: string;
  notes?: string;
}

export interface PublishInput {
  title: Claim["title"];
  status: Verdict;
  explanation: Claim["explanation"];
  sources: string[];
  verifiedBy: string;
}

interface StoreValue {
  claims: Claim[];
  ready: boolean;
  addSubmission: (input: NewSubmission) => void;
  publishClaim: (id: string, input: PublishInput) => void;
  rejectClaim: (id: string) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [claims, setClaims] = useState<Claim[]>(SEED_CLAIMS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setClaims(JSON.parse(raw) as Claim[]);
    } catch {
      /* fall back to seed */
    }
    setReady(true);
  }, []);

  const persist = useCallback((next: Claim[]) => {
    setClaims(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore quota errors in the prototype */
    }
  }, []);

  const addSubmission = useCallback(
    (input: NewSubmission) => {
      const now = new Date().toISOString();
      const claim: Claim = {
        id: newId(),
        title: { ka: input.title, hy: input.title, en: input.title },
        claim: { ka: input.claim, hy: input.claim, en: input.claim },
        explanation: { ka: "", hy: "", en: "" },
        status: "pending",
        category: input.category,
        sourceLang: input.sourceLang,
        submissionType: input.submissionType,
        sourceUrl: input.sourceUrl,
        sources: [],
        submittedAt: now,
      };
      persist([claim, ...claims]);
    },
    [claims, persist],
  );

  const publishClaim = useCallback(
    (id: string, input: PublishInput) => {
      const now = new Date().toISOString();
      persist(
        claims.map((c) =>
          c.id === id
            ? {
                ...c,
                title: input.title,
                status: input.status,
                explanation: input.explanation,
                sources: input.sources,
                verifiedBy: input.verifiedBy,
                verifiedAt: now,
              }
            : c,
        ),
      );
    },
    [claims, persist],
  );

  const rejectClaim = useCallback(
    (id: string) => {
      persist(claims.filter((c) => c.id !== id));
    },
    [claims, persist],
  );

  const value = useMemo(
    () => ({ claims, ready, addSubmission, publishClaim, rejectClaim }),
    [claims, ready, addSubmission, publishClaim, rejectClaim],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
