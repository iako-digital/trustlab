"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { LogoMark } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createBrowserSupabase } from "@/lib/supabase/browser";

type Problem = "credentials" | "notAdmin" | "notConfigured" | "network" | null;

export default function AdminLoginPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [problem, setProblem] = useState<Problem>(isSupabaseConfigured() ? null : "notConfigured");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy || !isSupabaseConfigured()) return;
    setBusy(true);
    setProblem(null);

    try {
      const supabase = createBrowserSupabase();
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) {
        // Supabase reports transport failures as status 0 / fetch errors.
        setProblem(error.status === 0 || /fetch/i.test(error.message) ? "network" : "credentials");
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
    } catch {
      setProblem("network");
      setBusy(false);
      return;
    }

    router.replace("/admin");
    router.refresh();
  };

  return (
    <div className="container py-8 sm:py-10">
      <form onSubmit={submit} className="mx-auto max-w-sm pt-10">
        <div className="rounded-2xl border border-brand-navy/15 border-t-4 border-t-brand-navy bg-paper-card p-7 shadow-lux">
          <LogoMark className="mb-4 h-14" />
          <h1 className="font-serif text-2xl font-semibold text-ink">{t("admin.title")}</h1>
          <p className="mb-5 mt-1 text-sm text-ink-soft">{t("admin.subtitle")}</p>

          <Label htmlFor="email">{t("admin.email")}</Label>
          <Input
            id="email"
            type="email"
            autoComplete="username"
            required
            placeholder="sunovibe.it@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <div className="mt-4">
            <Label htmlFor="pw">{t("admin.password")}</Label>
            <div className="relative">
              <Input
                id="pw"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                className="pr-11"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? t("admin.hidePassword") : t("admin.showPassword")}
                aria-pressed={showPassword}
                title={showPassword ? t("admin.hidePassword") : t("admin.showPassword")}
                className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-2xl text-ink-faint hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {problem && (
            <p role="alert" className="mt-3 text-xs text-verdict-fakeink">
              {problem === "credentials" && t("admin.wrongPassword")}
              {problem === "notAdmin" && t("admin.notAdmin")}
              {problem === "notConfigured" && t("admin.notConfigured")}
              {problem === "network" && t("admin.networkError")}
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
