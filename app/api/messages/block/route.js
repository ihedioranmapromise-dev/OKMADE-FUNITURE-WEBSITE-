import { createSupabaseServer } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

    const { data: me } = await admin
      .from("clients")
      .select("id")
      .eq("auth_id", user.id)
      .single();
    if (!me) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });

    const { thread_id, action } = await request.json();
    if (!thread_id || !["block", "unblock"].includes(action)) {
      return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400 });
    }

    const { data: thread } = await admin
      .from("message_threads")
      .select("user_a, user_b")
      .eq("id", thread_id)
      .maybeSingle();
    if (!thread) return new Response(JSON.stringify({ error: "Thread not found" }), { status: 404 });
    if (thread.user_a !== me.id && thread.user_b !== me.id) {
      return new Response(JSON.stringify({ error: "Not your thread" }), { status: 403 });
    }

    const otherId = thread.user_a === me.id ? thread.user_b : thread.user_a;

    if (action === "block") {
      // Remove friendship / follows
      const [a, b] = [me.id, otherId].sort();
      await admin.from("friends").delete().eq("user_a", a).eq("user_b", b);
      await admin.from("friend_requests").delete().eq("sender_id", me.id).eq("receiver_id", otherId);
      await admin.from("friend_requests").delete().eq("sender_id", otherId).eq("receiver_id", me.id);
      await admin.from("follows").delete().eq("follower_id", me.id).eq("following_id", otherId);
      await admin.from("follows").delete().eq("follower_id", otherId).eq("following_id", me.id);

      const { error } = await admin
        .from("blocks")
        .insert({ blocker_id: me.id, blocked_id: otherId });
      if (error && !error.message.includes("duplicate")) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
      }
      return new Response(JSON.stringify({ success: true, blocked: true }), { status: 200 });
    }

    await admin
      .from("blocks")
      .delete()
      .eq("blocker_id", me.id)
      .eq("blocked_id", otherId);
    return new Response(JSON.stringify({ success: true, blocked: false }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
