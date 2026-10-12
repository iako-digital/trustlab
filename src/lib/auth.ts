import "server-only";
import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export interface AdminIdentity {
  userId: string;
  email: string;
  displayName: string;
}

/**
 * Returns the signed-in admin, or null. The role is read from `admin_users`
 * under the user's own JWT (RLS lets a user read only their own row), and the
 * JWT is verified by Supabase via getUser() — never trust getSession() alone.
 */
export async function getAdmin(): Promise<AdminIdentity | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = await createServerSupabase();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return null;

    const { data: row } = await supabase
      .from("admin_users")
      .select("email, display_name, role")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!row || row.role !== "admin") return null;

    return { userId: user.id, email: row.email, displayName: row.display_name };
  } catch {
    // Treat any auth backend failure as "not an admin" (callers answer 401).
    return null;
  }
}

/** For route handlers: `const a = await requireAdmin(); if (a instanceof NextResponse) return a;` */
export async function requireAdmin(): Promise<AdminIdentity | NextResponse> {
  // Every admin route writes through the service-role client, so a missing key is
  // a configuration error (503), not an unhandled exception (500).
  if (!isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Server is not configured." }, { status: 503 });
  }
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  return admin;
}
