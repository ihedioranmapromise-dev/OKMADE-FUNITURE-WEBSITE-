import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { logActivity } from "@/lib/admin-auth";

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
    .select("id, username")
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
      if (!other) return new Response(JSON.stringify({ blocked: false }), { status: 200 });

      const { data } = await admin
        .from("blocks")
        .select("id")
        .eq("blocker_id", me.id)
        .eq("blocked_id", other.id)
        .maybeSingle();
      return new Response(JSON.stringify({ blocked: !!data }), { status: 200 });
    }

    const { data } = await admin
      .from("blocks")
      .select(`
        id, created_at,
        blocked:blocked_id (id, username, display_name, profile_pic)
      `)
      .eq("blocker_id", me.id)
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
    if (!username || !["block", "unblock"].includes(action)) {
      return new Response(JSON.stringify({ error: "username and action required" }), { status: 400 });
    }

    const { data: other } = await admin
      .from("clients")
      .select("id")
      .eq("username", username)
      .maybeSingle();
    if (!other) return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
    if (other.id === me.id) {
      return new Response(JSON.stringify({ error: "You cannot block yourself" }), { status: 400 });
    }

    if (action === "block") {
      // Remove existing friendship and follows
      const [a, b] = [me.id, other.id].sort();
      await admin.from("friends").delete().eq("user_a", a).eq("user_b", b);
      await admin.from("friend_requests").delete().eq("from_id", me.id).eq("to_id", other.id);
      await admin.from("friend_requests").delete().eq("from_id", other.id).eq("to_id", me.id);
      await admin.from("follows").delete().eq("follower_id", me.id).eq("following_id", other.id);
      await admin.from("follows").delete().eq("follower_id", other.id).eq("following_id", me.id);

      const { error } = await admin
        .from("blocks")
        .insert({ blocker_id: me.id, blocked_id: other.id });
      if (error && !error.message.includes("duplicate")) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
      }
      return new Response(JSON.stringify({ success: true, blocked: true }), { status: 200 });
    }

    // unblock
    await admin
      .from("blocks")
      .delete()
      .eq("blocker_id", me.id)
      .eq("blocked_id", other.id);
    return new Response(JSON.stringify({ success: true, blocked: false }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
