"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createBrowserSupabase } from "@/lib/supabase/browser";

type Problem = "credentials" | "notAdmin" | "notConfigured" | null;

export default function AdminLoginPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [problem, setProblem] = useState<Problem>(isSupabaseConfigured() ? null : "notConfigured");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy || !isSupabaseConfigured()) return;
    setBusy(true);
    setProblem(null);

    const supabase = createBrowserSupabase();
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setProblem("credentials");
      setBusy(false);
      return;
    }

    // Signing in is not enough: the server must confirm the admin role.
    const me = await fetch("/api/admin/me", { cache: "no-store" });
    if (!me.ok) {
      await supabase.auth.signOut();
      setProblem("notAdmin");
      setBusy(false);
      return;
    }

    router.replace("/admin");
    router.refresh();
  };

  return (
    <div className="container py-8 sm:py-10">
      <form onSubmit={submit} className="mx-auto max-w-sm pt-10">
        <div className="rounded-2xl border border-paper-line bg-paper-card p-7 shadow-card">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-ink text-paper">
            <Lock className="h-5 w-5" />
          </div>
          <h1 className="font-serif text-2xl font-semibold text-ink">{t("admin.title")}</h1>
          <p className="mb-5 mt-1 text-sm text-ink-soft">{t("admin.subtitle")}</p>

          <Label htmlFor="email">{t("admin.email")}</Label>
          <Input
            id="email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <div className="mt-4">
            <Label htmlFor="pw">{t("admin.password")}</Label>
            <Input
              id="pw"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {problem && (
            <p role="alert" className="mt-3 text-xs text-verdict-fake">
              {problem === "credentials" && t("admin.wrongPassword")}
              {problem === "notAdmin" && t("admin.notAdmin")}
              {problem === "notConfigured" && t("admin.notConfigured")}
            </p>
          )}

          <Button type="submit" disabled={busy || problem === "notConfigured"} className="mt-4 w-full">
            {busy ? t("admin.loginBusy") : t("admin.login")}
          </Button>
        </div>
      </form>
    </div>
  );
}
