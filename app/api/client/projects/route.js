import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getClientUser() {
  const cookieStore = await cookies();
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    }
  );
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return null;
  const { data: client } = await admin
    .from("clients")
    .select("id, username")
    .eq("auth_id", user.id)
    .maybeSingle();
  return client;
}

export async function GET() {
  try {
    const me = await getClientUser();
    if (!me) {
      return new Response(JSON.stringify({ error: "Not logged in" }), { status: 401 });
    }

    const { data: projects, error } = await admin
      .from("projects")
      .select(
        "id, token_string, work_description, city, duration_weeks, status, is_standalone, timeline, created_at"
      )
      .eq("client_id", me.id)
      .order("created_at", { ascending: false });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    const list = projects || [];

    const active = list.filter((p) => p.status !== "killed");
    const completed = list.filter((p) => p.status === "killed");

    return new Response(JSON.stringify({ active, completed }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
