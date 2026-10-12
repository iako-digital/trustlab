"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Analytics } from "@/components/admin/analytics";
import { ClaimEditor } from "@/components/admin/editor";
import { AiSuggestionPanel } from "@/components/admin/ai-suggestion-panel";
import { ClaimCard } from "@/components/claim-card";
import { useAdminClaims } from "@/lib/admin-api";
import { useI18n } from "@/lib/i18n";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";

type Tab = "pending" | "published" | "rejected" | "analytics";

/**
 * Rendered only for signed-in admins: middleware redirects everyone else to
 * /admin/login, and every API call below is re-checked on the server.
 */
export function AdminDashboard() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const { claims, suggestions, loading, loadFailed, act, decide, generate } = useAdminClaims();
  const [tab, setTab] = useState<Tab>("pending");
  const [me, setMe] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { displayName?: string } | null) => setMe(j?.displayName ?? null))
      .catch(() => setMe(null));
  }, []);

  const pending = claims.filter((c) => c.state === "pending");
  const published = claims.filter((c) => c.state === "published");
  const rejected = claims.filter((c) => c.state === "rejected");

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "pending", label: t("admin.tabPending"), count: pending.length },
    { key: "published", label: t("admin.tabPublished"), count: published.length },
    { key: "rejected", label: t("admin.tabRejected"), count: rejected.length },
    { key: "analytics", label: t("admin.tabAnalytics") },
  ];

  const logout = async () => {
    await createBrowserSupabase().auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  };

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-ink">{t("admin.title")}</h1>
          <p className="mt-1 text-ink-soft">{t("admin.subtitle")}</p>
          {me && <p className="mt-1 font-mono text-[11px] text-ink-faint">{me}</p>}
        </div>
        <Button variant="outline" size="sm" onClick={logout}>
          <LogOut className="h-4 w-4" />
          {t("admin.logout")}
        </Button>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-paper-line">
        {tabs.map((tb) => (
          <button
            key={tb.key}
            onClick={() => setTab(tb.key)}
            className={cn(
              "relative -mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
              tab === tb.key
                ? "border-ink text-ink"
                : "border-transparent text-ink-faint hover:text-ink-soft",
            )}
          >
            {tb.label}
            {tb.count !== undefined && (
              <span className="ml-1.5 rounded-full bg-paper-line px-1.5 py-0.5 font-mono text-[10px] text-ink-soft">
                {tb.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {loadFailed && (
        <p role="alert" className="mb-4 text-sm text-verdict-fakeink">
          {t("admin.loadError")}
        </p>
      )}

      {!loading && tab === "analytics" && <Analytics claims={claims} />}

      {!loading && tab === "pending" &&
        (pending.length === 0 ? (
          <EmptyState>{t("admin.noPending")}</EmptyState>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {pending.map((c) => (
              <ClaimEditor
                key={c.id}
                claim={c}
                onAct={act}
                aiPanel={
                  <AiSuggestionPanel
                    claim={c}
                    suggestion={suggestions.find((s) => s.claimId === c.id)}
                    onDecide={decide}
                    onGenerate={generate}
                  />
                }
              />
            ))}
          </div>
        ))}

      {!loading && tab === "published" &&
        (published.length === 0 ? (
          <EmptyState>{t("admin.publishedEmpty")}</EmptyState>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {published.map((c) => (
              <ClaimCard key={c.id} claim={c} />
            ))}
          </div>
        ))}

      {!loading && tab === "rejected" &&
        (rejected.length === 0 ? (
          <EmptyState>{t("admin.noRejected")}</EmptyState>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {rejected.map((c) => (
              <div
                key={c.id}
                className="rounded-2xl border border-paper-line bg-paper-card p-5 shadow-card"
              >
                <h3 className="font-serif text-lg font-semibold text-ink">{c.title[locale]}</h3>
                <p className="mt-1.5 text-sm text-ink-soft">{c.claim[locale]}</p>
                {c.rejectReason && (
                  <p className="mt-3 rounded-xl bg-verdict-fakebg px-3 py-2 text-sm text-ink">
                    {t("admin.rejectedWhy", { reason: c.rejectReason })}
                  </p>
                )}
                <div className="mt-4 flex justify-end">
                  <RestoreButton onClick={() => act(c.id, { action: "restore" })} />
                </div>
              </div>
            ))}
          </div>
        ))}
    </div>
  );
}

function RestoreButton({ onClick }: { onClick: () => Promise<boolean> }) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  return (
    <div className="flex items-center gap-3">
      {failed && <span className="text-xs text-verdict-fakeink">{t("admin.actionError")}</span>}
      <Button
        variant="outline"
        size="sm"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setFailed(!(await onClick()));
          setBusy(false);
        }}
      >
        {t("admin.restore")}
      </Button>
    </div>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-paper-line bg-paper-card py-16 text-center text-ink-faint">
      {children}
    </div>
  );
}
