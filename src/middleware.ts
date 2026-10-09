import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "@/lib/supabase/env";

/**
 * Server-side gate for everything admin: /admin/*, /api/admin/*, /api/analyze.
 * Also refreshes the Supabase session cookie. Route handlers re-check the
 * role themselves (requireAdmin) — this is defense in depth, not the only door.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApi = pathname.startsWith("/api/");
  const isLoginPage = pathname === "/admin/login";

  if (!isSupabaseConfigured()) {
    // Fail closed: never expose admin surface when auth cannot be verified.
    if (isLoginPage) return NextResponse.next();
    return isApi
      ? NextResponse.json({ error: "Server is not configured." }, { status: 503 })
      : NextResponse.redirect(new URL("/admin/login", request.url));
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data: userData } = await supabase.auth.getUser();
  let isAdmin = false;
  if (userData.user) {
    const { data: row } = await supabase
      .from("admin_users")
      .select("role")
      .eq("user_id", userData.user.id)
      .maybeSingle();
    isAdmin = row?.role === "admin";
  }

  if (isLoginPage) {
    // Already signed in as admin: skip the form.
    return isAdmin ? NextResponse.redirect(new URL("/admin", request.url)) : response;
  }

  if (!isAdmin) {
    return isApi
      ? NextResponse.json({ error: "Unauthorized." }, { status: 401 })
      : NextResponse.redirect(new URL("/admin/login", request.url));
  }
  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/api/analyze"],
};
