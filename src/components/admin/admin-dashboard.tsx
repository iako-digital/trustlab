"use client";

import { Lock } from "lucide-react";
import { useI18n } from "@/lib/i18n";

/**
 * Interim lock. The client-side demo password was removed because anything
 * shipped in a JS bundle is public. Real server-side auth lands in the next
 * commits of this branch.
 */
export function AdminDashboard() {
  const { t } = useI18n();
  return (
    <div className="mx-auto max-w-sm pt-10">
      <div className="rounded-2xl border border-paper-line bg-paper-card p-7 shadow-card">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-ink text-paper">
          <Lock className="h-5 w-5" />
        </div>
        <h1 className="font-serif text-2xl font-semibold text-ink">{t("admin.title")}</h1>
        <p className="mt-2 text-sm text-ink-soft">{t("admin.locked")}</p>
      </div>
    </div>
  );
}
