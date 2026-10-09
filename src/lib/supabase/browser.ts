import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/env";

/** Browser client: anon key + the signed-in user's session cookie. */
export function createBrowserSupabase() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
