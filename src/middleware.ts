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

  const deny = (status: 401 | 503) =>
    isApi
      ? NextResponse.json({ error: status === 401 ? "Unauthorized." : "Auth unavailable." }, { status })
      : NextResponse.redirect(new URL("/admin/login", request.url));

  let response = NextResponse.next({ request });
  let isAdmin = false;
  try {
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

    // No session, an expired/corrupt cookie or no admin row all end up as isAdmin = false.
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      const { data: row } = await supabase
        .from("admin_users")
        .select("role")
        .eq("user_id", userData.user.id)
        .maybeSingle();
      isAdmin = row?.role === "admin";
    }
  } catch {
    // Supabase unreachable or misconfigured: never surface a 500; fail closed.
    return isLoginPage ? NextResponse.next() : deny(503);
  }

  if (isLoginPage) {
    // Already signed in as admin: skip the form.
    return isAdmin ? NextResponse.redirect(new URL("/admin", request.url)) : response;
  }

  return isAdmin ? response : deny(401);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/api/analyze"],
};
