"use client";

import { useEffect, useState } from "react";
import { Lock, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Analytics } from "@/components/admin/analytics";
import { ClaimEditor } from "@/components/admin/editor";
import { ClaimCard } from "@/components/claim-card";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const DEMO_PASSWORD = "caucasus";
const AUTH_KEY = "mbc.admin.auth";

type Tab = "pending" | "published" | "analytics";

export function AdminDashboard() {
  const { t } = useI18n();
  const { claims } = useStore();
  const [authed, setAuthed] = useState(false);
  const [checked, setChecked] = useState(false);
  const [tab, setTab] = useState<Tab>("pending");

  useEffect(() => {
    setAuthed(window.sessionStorage.getItem(AUTH_KEY) === "1");
    setChecked(true);
  }, []);

  if (!checked) return null;
  if (!authed) return <Login onSuccess={() => setAuthed(true)} />;

  const pending = claims.filter((c) => c.status === "pending");
  const published = claims.filter((c) => c.status !== "pending");

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "pending", label: t("admin.tabPending"), count: pending.length },
    { key: "published", label: t("admin.tabPublished"), count: published.length },
    { key: "analytics", label: t("admin.tabAnalytics") },
  ];

  const logout = () => {
    window.sessionStorage.removeItem(AUTH_KEY);
    setAuthed(false);
  };

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-ink">{t("admin.title")}</h1>
          <p className="mt-1 text-ink-soft">{t("admin.subtitle")}</p>
        </div>
        <Button variant="outline" size="sm" onClick={logout}>
          <LogOut className="h-4 w-4" />
          {t("admin.logout")}
        </Button>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 border-b border-paper-line">
        {tabs.map((tb) => (
          <button
            key={tb.key}
            onClick={() => setTab(tb.key)}
            className={cn(
              "relative -mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
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

      {tab === "analytics" && <Analytics />}

      {tab === "pending" &&
        (pending.length === 0 ? (
          <EmptyState>{t("admin.noPending")}</EmptyState>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {pending.map((c) => (
              <ClaimEditor key={c.id} claim={c} />
            ))}
          </div>
        ))}

      {tab === "published" &&
        (published.length === 0 ? (
          <EmptyState>{t("admin.publishedEmpty")}</EmptyState>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {published.map((c) => (
              <ClaimCard key={c.id} claim={c} />
            ))}
          </div>
        ))}
    </div>
  );
}

function Login({ onSuccess }: { onSuccess: () => void }) {
  const { t } = useI18n();
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const submit = () => {
    if (password === DEMO_PASSWORD) {
      window.sessionStorage.setItem(AUTH_KEY, "1");
      onSuccess();
    } else {
      setError(true);
    }
  };

  return (
    <div className="mx-auto max-w-sm pt-10">
      <div className="rounded-2xl border border-paper-line bg-paper-card p-7 shadow-card transform transition-smooth hover:-translate-y-1">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-ink text-paper">
          <Lock className="h-5 w-5" />
        </div>
        <h1 className="font-serif text-2xl font-semibold text-ink">{t("admin.title")}</h1>
        <p className="mb-5 mt-1 text-sm text-ink-soft">{t("admin.subtitle")}</p>
        <Label htmlFor="pw">{t("admin.password")}</Label>
        <Input
          id="pw"
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError(false);
          }}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          className={error ? "border-verdict-fake" : ""}
        />
        {error && <p className="mt-1 text-xs text-verdict-fake">{t("admin.wrongPassword")}</p>}
        <Button onClick={submit} className="mt-4 w-full">
          {t("admin.login")}
        </Button>
        <p className="mt-3 text-center font-mono text-[11px] text-ink-faint">{t("admin.hint")}</p>
      </div>
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
