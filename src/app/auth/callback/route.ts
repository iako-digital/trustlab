import { NextResponse, type NextRequest } from "next/server";
import { getAdmin } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

/**
 * OAuth (Google) return URL. Exchanges the one-time code for a session cookie,
 * then applies the same rule as password login: the account must be listed in
 * `public.admin_users` with role 'admin'. Anyone else is signed out again, so
 * a stray Google sign-in never leaves a usable session behind.
 * The destination is fixed (/admin): there is no user-supplied redirect.
 */
export async function GET(request: NextRequest) {
  const { origin, searchParams } = request.nextUrl;
  const fail = (reason: "oauth" | "notAdmin") =>
    NextResponse.redirect(`${origin}/admin/login?error=${reason}`);

  if (!isSupabaseConfigured()) return fail("oauth");

  const code = searchParams.get("code");
  if (!code || searchParams.get("error")) return fail("oauth");

  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return fail("oauth");

  if (!(await getAdmin())) {
    await supabase.auth.signOut();
    return fail("notAdmin");
  }
  return NextResponse.redirect(`${origin}/admin`);
}
