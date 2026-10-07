import { createBrowserClient } from "@supabase/ssr";

let cached = null;

export function createSupabaseBrowser() {
  if (cached) return cached;
  cached = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  return cached;
}
