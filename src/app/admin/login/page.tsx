"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { LogoMark } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createBrowserSupabase } from "@/lib/supabase/browser";

type Problem = "credentials" | "notAdmin" | "notConfigured" | "network" | "oauth" | null;

export default function AdminLoginPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [problem, setProblem] = useState<Problem>(isSupabaseConfigured() ? null : "notConfigured");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // The OAuth callback reports failures as /admin/login?error=...
  useEffect(() => {
    const err = new URLSearchParams(window.location.search).get("error");
    if (err === "notAdmin" || err === "oauth") setProblem(err);
  }, []);

  const signInWithGoogle = async () => {
    if (busy || !isSupabaseConfigured()) return;
    setBusy(true);
    setProblem(null);
    try {
      const { error } = await createBrowserSupabase().auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
      // Success navigates away to Google; keep the button disabled meanwhile.
    } catch {
      setProblem("oauth");
      setBusy(false);
    }
  };

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

          <Button
            type="button"
            variant="outline"
            onClick={signInWithGoogle}
            disabled={busy || problem === "notConfigured"}
            className="w-full"
          >
            <GoogleIcon />
            {t("admin.google")}
          </Button>

          <div className="my-5 flex items-center gap-3 text-xs text-ink-faint" aria-hidden>
            <span className="h-px flex-1 bg-paper-line" />
            {t("admin.or")}
            <span className="h-px flex-1 bg-paper-line" />
          </div>

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
              {problem === "oauth" && t("admin.oauthError")}
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

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden className="h-4 w-4">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.2C12.4 13.6 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.2 5.4-4.7 7.1l7.6 5.9c4.4-4.1 6.9-10.1 6.9-17.5z" />
      <path fill="#FBBC05" d="M10.5 28.6A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.1.8-4.6l-7.9-6.2A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l7.9-6.2z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}
