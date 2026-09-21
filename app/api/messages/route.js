import { createSupabaseServer } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// GET: list my threads
export async function GET() {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

    const { data: me } = await admin.from("clients").select("id").eq("auth_id", user.id).single();
    if (!me) return new Response(JSON.stringify([]), { status: 200 });

    const { data: threads } = await admin
      .from("message_threads")
      .select("*")
      .or(`user_a.eq.${me.id},user_b.eq.${me.id}`)
      .order("last_message_at", { ascending: false });

    // Attach other user info
    const threadsWithUsers = await Promise.all(
      (threads || []).map(async (t) => {
        const otherId = t.user_a === me.id ? t.user_b : t.user_a;
        const { data: other } = await admin
          .from("clients")
          .select("username, display_name, profile_pic")
          .eq("id", otherId)
          .single();

        const { count: unread } = await admin
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("thread_id", t.id)
          .eq("receiver_id", me.id)
          .is("read_at", null);

        return { ...t, other, unread: unread || 0 };
      })
    );

    return new Response(JSON.stringify(threadsWithUsers), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

// POST: create/find thread with a username
export async function POST(request) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

    const { username } = await request.json();
    const { data: me } = await admin.from("clients").select("id").eq("auth_id", user.id).single();
    const { data: other } = await admin.from("clients").select("id").eq("username", username).single();

    if (!me || !other) return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
    if (me.id === other.id) return new Response(JSON.stringify({ error: "Cannot message yourself" }), { status: 400 });

    // Check friendship
    const { data: friends } = await admin
      .from("friends")
      .select("id")
      .or(`and(user_a.eq.${me.id},user_b.eq.${other.id}),and(user_a.eq.${other.id},user_b.eq.${me.id})`)
      .single();
    if (!friends) return new Response(JSON.stringify({ error: "You must be friends to message" }), { status: 403 });

    // Sort IDs
    const [a, b] = [me.id, other.id].sort();

    const { data: existing } = await admin
      .from("message_threads")
      .select("id")
      .eq("user_a", a)
      .eq("user_b", b)
      .single();

    if (existing) return new Response(JSON.stringify({ thread_id: existing.id }), { status: 200 });

    const { data: created } = await admin
      .from("message_threads")
      .insert([{ user_a: a, user_b: b }])
      .select("id")
      .single();

    return new Response(JSON.stringify({ thread_id: created.id }), { status: 201 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
