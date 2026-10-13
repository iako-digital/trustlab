"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { ClaimForm } from "@/components/admin/claim-form";
import { Analytics } from "@/components/admin/analytics";
import { ClaimEditor } from "@/components/admin/editor";
import { AiSuggestionPanel } from "@/components/admin/ai-suggestion-panel";
import { ClaimCard } from "@/components/claim-card";
import { useAdminClaims } from "@/lib/admin-api";
import { useI18n } from "@/lib/i18n";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";
import type { Claim } from "@/lib/types";

type Tab = "pending" | "published" | "rejected" | "analytics";

/**
 * Rendered only for signed-in admins: middleware redirects everyone else to
 * /admin/login, and every API call below is re-checked on the server.
 */
export function AdminDashboard() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const {
    claims,
    suggestions,
    loading,
    loadFailed,
    act,
    decide,
    generate,
    createClaim,
    editClaim,
    removeClaim,
  } = useAdminClaims();
  const [form, setForm] = useState<{ claim?: Claim } | null>(null);
  const [deleting, setDeleting] = useState<Claim | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteFailed, setDeleteFailed] = useState(false);
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
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-ink sm:text-3xl">{t("admin.title")}</h1>
          <p className="mt-1 text-ink-soft">{t("admin.subtitle")}</p>
          {me && <p className="mt-1 font-mono text-[11px] text-ink-faint">{me}</p>}
        </div>
        <div className="flex flex-wrap gap-2 sm:justify-end">
          <Button variant="brand" size="sm" onClick={() => setForm({})}>
            <Plus className="h-4 w-4" />
            {t("admin.newClaim")}
          </Button>
          <Button variant="outline" size="sm" onClick={logout}>
            <LogOut className="h-4 w-4" />
            {t("admin.logout")}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="-mx-5 mb-6 flex gap-1 overflow-x-auto border-b px-5 sm:mx-0 sm:px-0 border-b border-paper-line">
        {tabs.map((tb) => (
          <button
            key={tb.key}
            onClick={() => setTab(tb.key)}
            className={cn(
              "relative -mb-px whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium transition-colors sm:px-4 sm:py-2.5",
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
              <div key={c.id} className="flex flex-col gap-2">
                <ClaimCard claim={c} />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setForm({ claim: c })}>
                    <Pencil className="h-4 w-4" />
                    {t("admin.edit")}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-verdict-fakeink"
                    onClick={() => {
                      setDeleteFailed(false);
                      setDeleting(c);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                    {t("admin.delete")}
                  </Button>
                </div>
              </div>
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
                <div className="mt-4 flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-verdict-fakeink"
                    onClick={() => {
                      setDeleteFailed(false);
                      setDeleting(c);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                    {t("admin.delete")}
                  </Button>
                  <RestoreButton onClick={() => act(c.id, { action: "restore" })} />
                </div>
              </div>
            ))}
          </div>
        ))}

      <Modal
        open={form !== null}
        onClose={() => setForm(null)}
        title={form?.claim ? t("admin.editClaim") : t("admin.newClaim")}
        className="max-w-2xl"
      >
        {form && (
          <ClaimForm
            claim={form.claim}
            onCancel={() => setForm(null)}
            onSubmit={async (v) => {
              const res = form.claim ? await editClaim(form.claim.id, v) : await createClaim(v);
              if (res.ok) setForm(null);
              return res;
            }}
          />
        )}
      </Modal>

      <Modal open={deleting !== null} onClose={() => setDeleting(null)} title={t("admin.delete")}>
        <h3 className="pr-6 font-serif text-lg font-semibold text-ink">{t("admin.delete")}</h3>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          {t("admin.deleteConfirm", { title: deleting?.title[locale] ?? "" })}
        </p>
        {deleteFailed && (
          <p role="alert" className="mt-2 text-xs text-verdict-fakeink">
            {t("admin.actionError")}
          </p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setDeleting(null)} disabled={deleteBusy}>
            {t("admin.cancel")}
          </Button>
          <Button
            variant="danger"
            disabled={deleteBusy}
            onClick={async () => {
              if (!deleting) return;
              setDeleteBusy(true);
              const res = await removeClaim(deleting.id);
              setDeleteBusy(false);
              if (res.ok) setDeleting(null);
              else setDeleteFailed(true);
            }}
          >
            {t("admin.delete")}
          </Button>
        </div>
      </Modal>
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
