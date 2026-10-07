import { createSupabaseServer } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ALLOWED = ["like", "love", "haha", "wow", "sad", "angry"];

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

    const { message_id, reaction_type } = await request.json();
    if (!message_id || !ALLOWED.includes(reaction_type)) {
      return new Response(JSON.stringify({ error: "Invalid" }), { status: 400 });
    }

    const { data: msg } = await admin
      .from("messages")
      .select("id, thread_id, sender_id, receiver_id")
      .eq("id", message_id)
      .maybeSingle();
    if (!msg) return new Response(JSON.stringify({ error: "Message not found" }), { status: 404 });
    if (msg.sender_id !== me.id && msg.receiver_id !== me.id) {
      return new Response(JSON.stringify({ error: "Not in thread" }), { status: 403 });
    }

    const { data: existing } = await admin
      .from("message_reactions")
      .select("id, reaction_type")
      .eq("message_id", message_id)
      .eq("user_id", me.id)
      .maybeSingle();

    if (existing) {
      if (existing.reaction_type === reaction_type) {
        await admin.from("message_reactions").delete().eq("id", existing.id);
        return new Response(JSON.stringify({ action: "removed" }), { status: 200 });
      }
      await admin
        .from("message_reactions")
        .update({ reaction_type })
        .eq("id", existing.id);
      return new Response(JSON.stringify({ action: "updated" }), { status: 200 });
    }

    await admin.from("message_reactions").insert({
      message_id,
      user_id: me.id,
      reaction_type,
    });

    return new Response(JSON.stringify({ action: "added" }), { status: 201 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
