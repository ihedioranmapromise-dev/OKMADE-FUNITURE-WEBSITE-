import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getMe() {
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
  if (!user) return null;
  const { data: client } = await admin
    .from("clients")
    .select("id")
    .eq("auth_id", user.id)
    .maybeSingle();
  return client;
}

export async function GET(request) {
  try {
    const me = await getMe();
    if (!me) return new Response(JSON.stringify([]), { status: 200 });

    const { searchParams } = new URL(request.url);
    const target = searchParams.get("username");

    if (target) {
      const { data: other } = await admin
        .from("clients")
        .select("id")
        .eq("username", target)
        .maybeSingle();
      if (!other) return new Response(JSON.stringify({ muted: false }), { status: 200 });

      const { data } = await admin
        .from("mutes")
        .select("id")
        .eq("muter_id", me.id)
        .eq("muted_id", other.id)
        .maybeSingle();
      return new Response(JSON.stringify({ muted: !!data }), { status: 200 });
    }

    const { data } = await admin
      .from("mutes")
      .select(`
        id, created_at,
        muted:muted_id (id, username, display_name, profile_pic)
      `)
      .eq("muter_id", me.id)
      .order("created_at", { ascending: false });
    return new Response(JSON.stringify(data || []), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

export async function POST(request) {
  try {
    const me = await getMe();
    if (!me) return new Response(JSON.stringify({ error: "Not logged in" }), { status: 401 });

    const { username, action } = await request.json();
    if (!username || !["mute", "unmute"].includes(action)) {
      return new Response(JSON.stringify({ error: "username and action required" }), { status: 400 });
    }

    const { data: other } = await admin
      .from("clients")
      .select("id")
      .eq("username", username)
      .maybeSingle();
    if (!other) return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
    if (other.id === me.id) {
      return new Response(JSON.stringify({ error: "You cannot mute yourself" }), { status: 400 });
    }

    if (action === "mute") {
      const { error } = await admin
        .from("mutes")
        .insert({ muter_id: me.id, muted_id: other.id });
      if (error && !error.message.includes("duplicate")) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
      }
      return new Response(JSON.stringify({ success: true, muted: true }), { status: 200 });
    }

    await admin
      .from("mutes")
      .delete()
      .eq("muter_id", me.id)
      .eq("muted_id", other.id);
    return new Response(JSON.stringify({ success: true, muted: false }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
