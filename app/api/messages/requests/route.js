import { createSupabaseServer } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET() {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify([]), { status: 200 });

    const { data: me } = await admin
      .from("clients")
      .select("id")
      .eq("auth_id", user.id)
      .maybeSingle();
    if (!me) return new Response(JSON.stringify([]), { status: 200 });

    const { data } = await admin
      .from("message_requests")
      .select("id, first_message, created_at, from_id, from:from_id (username, display_name, profile_pic)")
      .eq("to_id", me.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    return new Response(JSON.stringify(data || []), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

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

    const { request_id, action } = await request.json();
    if (!request_id || !["accept", "decline"].includes(action)) {
      return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400 });
    }

    const { data: req } = await admin
      .from("message_requests")
      .select("*")
      .eq("id", request_id)
      .eq("to_id", me.id)
      .eq("status", "pending")
      .maybeSingle();
    if (!req) return new Response(JSON.stringify({ error: "Request not found" }), { status: 404 });

    if (action === "decline") {
      await admin
        .from("message_requests")
        .update({ status: "declined" })
        .eq("id", request_id);
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    // Accept: create friendship, thread, first message
    const [a, b] = [req.from_id, req.to_id].sort();
    const { data: existingFriends } = await admin
      .from("friends")
      .select("id")
      .eq("user_a", a)
      .eq("user_b", b)
      .maybeSingle();
    if (!existingFriends) {
      await admin.from("friends").insert([{ user_a: a, user_b: b }]);
    }

    const { data: existingThread } = await admin
      .from("message_threads")
      .select("id")
      .eq("user_a", a)
      .eq("user_b", b)
      .maybeSingle();

    let threadId = existingThread?.id;

    if (!threadId) {
      const { data: created } = await admin
        .from("message_threads")
        .insert([{ user_a: a, user_b: b }])
        .select("id")
        .single();
      threadId = created.id;
    }

    if (req.first_message) {
      await admin.from("messages").insert([{
        thread_id: threadId,
        sender_id: req.from_id,
        receiver_id: req.to_id,
        content: req.first_message,
      }]);
      await admin
        .from("message_threads")
        .update({
          last_message_at: new Date().toISOString(),
          last_message_preview: req.first_message.slice(0, 80),
          last_message_sender: req.from_id,
        })
        .eq("id", threadId);
    }

    await admin
      .from("message_requests")
      .update({ status: "accepted" })
      .eq("id", request_id);

    return new Response(JSON.stringify({ success: true, thread_id: threadId }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
