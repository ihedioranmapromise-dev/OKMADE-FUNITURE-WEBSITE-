import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const sb = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll() {},
        },
      }
    );
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return new Response(JSON.stringify({ pending: false }), { status: 200 });

    const { data: client } = await admin
      .from("clients")
      .select("id, deletion_requested_at, deletion_scheduled_for")
      .eq("auth_id", user.id)
      .maybeSingle();

    if (!client || !client.deletion_requested_at) {
      return new Response(JSON.stringify({ pending: false }), { status: 200 });
    }

    return new Response(
      JSON.stringify({
        pending: true,
        requested_at: client.deletion_requested_at,
        scheduled_for: client.deletion_scheduled_for,
      }),
      { status: 200 }
    );
  } catch (err) {
    return new Response(JSON.stringify({ pending: false, error: err.message }), { status: 200 });
  }
}
