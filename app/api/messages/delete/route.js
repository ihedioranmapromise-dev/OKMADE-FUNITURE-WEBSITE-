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

    const { message_id } = await request.json();
    if (!message_id) return new Response(JSON.stringify({ error: "message_id required" }), { status: 400 });

    const { data: msg } = await admin
      .from("messages")
      .select("id, sender_id")
      .eq("id", message_id)
      .maybeSingle();
    if (!msg) return new Response(JSON.stringify({ error: "Message not found" }), { status: 404 });
    if (msg.sender_id !== me.id) {
      return new Response(JSON.stringify({ error: "Not your message" }), { status: 403 });
    }

    await admin
      .from("messages")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", message_id);

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
