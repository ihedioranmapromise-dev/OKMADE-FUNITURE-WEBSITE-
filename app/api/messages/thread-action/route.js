import { createSupabaseServer } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getMe() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: client } = await admin
    .from("clients")
    .select("id")
    .eq("auth_id", user.id)
    .maybeSingle();
  return client;
}

export async function POST(request) {
  try {
    const me = await getMe();
    if (!me) return new Response(JSON.stringify({ error: "Not logged in" }), { status: 401 });

    const { thread_id, action, message_id, seconds } = await request.json();
    if (!thread_id || !action) {
      return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400 });
    }

    const { data: thread } = await admin
      .from("message_threads")
      .select("id, user_a, user_b, pinned_by, archived_by, deleted_by, pinned_message_id, disappear_after_seconds")
      .eq("id", thread_id)
      .maybeSingle();
    if (!thread) return new Response(JSON.stringify({ error: "Thread not found" }), { status: 404 });
    if (thread.user_a !== me.id && thread.user_b !== me.id) {
      return new Response(JSON.stringify({ error: "Not your thread" }), { status: 403 });
    }

    const pinnedList = new Set(thread.pinned_by || []);
    const archivedList = new Set(thread.archived_by || []);
    const deletedList = new Set(thread.deleted_by || []);

    if (action === "pin") pinnedList.add(me.id);
    else if (action === "unpin") pinnedList.delete(me.id);
    else if (action === "archive") archivedList.add(me.id);
    else if (action === "unarchive") archivedList.delete(me.id);
    else if (action === "delete_for_me") deletedList.add(me.id);
    else if (action === "undelete") deletedList.delete(me.id);
    else if (action === "disappear_on") {
      const valid = [3600, 86400, 604800];
      const dur = valid.includes(Number(seconds)) ? Number(seconds) : 86400;
      await admin
        .from("message_threads")
        .update({ disappear_after_seconds: dur })
        .eq("id", thread_id);
      return new Response(JSON.stringify({ success: true, disappear_after_seconds: dur }), { status: 200 });
    } else if (action === "disappear_off") {
      await admin
        .from("message_threads")
        .update({ disappear_after_seconds: null })
        .eq("id", thread_id);
      return new Response(JSON.stringify({ success: true, disappear_after_seconds: null }), { status: 200 });
    } else if (action === "pin_message") {
      if (!message_id) return new Response(JSON.stringify({ error: "message_id required" }), { status: 400 });
      const { data: msg } = await admin
        .from("messages")
        .select("id, thread_id")
        .eq("id", message_id)
        .maybeSingle();
      if (!msg || msg.thread_id !== thread_id) {
        return new Response(JSON.stringify({ error: "Message not in this thread" }), { status: 400 });
      }
      await admin
        .from("message_threads")
        .update({ pinned_message_id: message_id })
        .eq("id", thread_id);
      return new Response(JSON.stringify({ success: true, pinned_message_id: message_id }), { status: 200 });
    } else if (action === "unpin_message") {
      await admin
        .from("message_threads")
        .update({ pinned_message_id: null })
        .eq("id", thread_id);
      return new Response(JSON.stringify({ success: true, pinned_message_id: null }), { status: 200 });
    } else {
      return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400 });
    }

    const { error } = await admin
      .from("message_threads")
      .update({
        pinned_by: Array.from(pinnedList),
        archived_by: Array.from(archivedList),
        deleted_by: Array.from(deletedList),
      })
      .eq("id", thread_id);

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

    return new Response(
      JSON.stringify({
        success: true,
        pinned: pinnedList.has(me.id),
        archived: archivedList.has(me.id),
        deleted: deletedList.has(me.id),
      }),
      { status: 200 }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
