import { createSupabaseServer } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// GET: messages in a thread
export async function GET(request, { params }) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

    const { threadId } = params;
    const { data: me } = await admin.from("clients").select("id").eq("auth_id", user.id).single();
    if (!me) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });

    const { data: thread } = await admin
      .from("message_threads")
      .select("*")
      .eq("id", threadId)
      .single();
    if (!thread) return new Response(JSON.stringify({ error: "Thread not found" }), { status: 404 });
    if (thread.user_a !== me.id && thread.user_b !== me.id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    }

    const { data: messages } = await admin
      .from("messages")
      .select("*")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true });

    // Mark messages as read
    await admin
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("thread_id", threadId)
      .eq("receiver_id", me.id)
      .is("read_at", null);

    const otherId = thread.user_a === me.id ? thread.user_b : thread.user_a;
    const { data: other } = await admin
      .from("clients")
      .select("username, display_name, profile_pic, skill")
      .eq("id", otherId)
      .single();

    return new Response(JSON.stringify({ thread, other, messages: messages || [], my_id: me.id }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

// POST: send a message in a thread
export async function POST(request, { params }) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

    const { threadId } = params;
    const { content } = await request.json();
    if (!content?.trim()) return new Response(JSON.stringify({ error: "Empty message" }), { status: 400 });

    const { data: me } = await admin.from("clients").select("id").eq("auth_id", user.id).single();
    if (!me) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });

    const { data: thread } = await admin
      .from("message_threads")
      .select("*")
      .eq("id", threadId)
      .single();
    if (!thread) return new Response(JSON.stringify({ error: "Thread not found" }), { status: 404 });
    if (thread.user_a !== me.id && thread.user_b !== me.id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    }

    const receiverId = thread.user_a === me.id ? thread.user_b : thread.user_a;

    const { data: msg, error } = await admin
      .from("messages")
      .insert([{
        thread_id: threadId,
        sender_id: me.id,
        receiver_id: receiverId,
        content: content.trim(),
      }])
      .select()
      .single();

    if (error) throw error;

    await admin
      .from("message_threads")
      .update({
        last_message_at: new Date().toISOString(),
        last_message_preview: content.trim().slice(0, 80),
        last_message_sender: me.id,
      })
      .eq("id", threadId);

    // Notification
    await admin.from("notifications").insert([{
      client_id: receiverId,
      type: "new_message",
      message: `New message from someone.`,
      target_url: `/client/messages/${threadId}`,
    }]);

    return new Response(JSON.stringify(msg), { status: 201 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
