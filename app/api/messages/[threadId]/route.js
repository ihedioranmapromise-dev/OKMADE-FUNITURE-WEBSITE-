import { createSupabaseServer } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/send-email";
import { newMessageEmail } from "@/lib/email-templates";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function userWantsEmails(clientId) {
  const { data } = await admin
    .from("user_settings")
    .select("email_notifications")
    .eq("user_id", clientId)
    .maybeSingle();
  return data?.email_notifications ?? true;
}

async function isBlockedEitherWay(a, b) {
  const { data } = await admin
    .from("blocks")
    .select("id")
    .or(
      `and(blocker_id.eq.${a},blocked_id.eq.${b}),and(blocker_id.eq.${b},blocked_id.eq.${a})`
    )
    .maybeSingle();
  return !!data;
}

export async function GET(request, { params }) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

    const { threadId } = params;
    const { data: me } = await admin.from("clients").select("id").eq("auth_id", user.id).single();
    if (!me) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });

    const { data: thread } = await admin.from("message_threads").select("*").eq("id", threadId).single();
    if (!thread) return new Response(JSON.stringify({ error: "Thread not found" }), { status: 404 });
    if (thread.user_a !== me.id && thread.user_b !== me.id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    }

    const otherId = thread.user_a === me.id ? thread.user_b : thread.user_a;
    if (await isBlockedEitherWay(me.id, otherId)) {
      return new Response(JSON.stringify({ error: "Blocked", isBlocked: true }), { status: 403 });
    }

    const { data: messages } = await admin
      .from("messages")
      .select("*")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true });

    // Mark delivered
    await admin
      .from("messages")
      .update({ delivered_at: new Date().toISOString() })
      .eq("thread_id", threadId)
      .eq("receiver_id", me.id)
      .is("delivered_at", null);

    const { searchParams } = new URL(request.url);
    const shouldMarkRead = searchParams.get("mark_read") === "1";
    if (shouldMarkRead) {
      await admin
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("thread_id", threadId)
        .eq("receiver_id", me.id)
        .is("read_at", null);
    }

    const { data: other } = await admin
      .from("clients")
      .select("username, display_name, profile_pic, skill")
      .eq("id", otherId)
      .maybeSingle();

    const cleaned = (messages || []).map((m) => {
      if (m.deleted_at) return { ...m, content: "", deleted: true };
      return m;
    });

    // Fetch reactions for all messages in this thread
    const msgIds = cleaned.map((m) => m.id).filter(Boolean);
    let reactionsByMessage = {};
    if (msgIds.length > 0) {
      const { data: reactions } = await admin
        .from("message_reactions")
        .select("message_id, user_id, reaction_type")
        .in("message_id", msgIds);
      (reactions || []).forEach((r) => {
        if (!reactionsByMessage[r.message_id]) reactionsByMessage[r.message_id] = [];
        reactionsByMessage[r.message_id].push(r);
      });
    }

    // Attach reply previews
    const replyIds = cleaned.map((m) => m.reply_to_id).filter(Boolean);
    let repliesById = {};
    if (replyIds.length > 0) {
      const { data: originals } = await admin
        .from("messages")
        .select("id, content, sender_id, deleted_at")
        .in("id", replyIds);
      (originals || []).forEach((o) => {
        repliesById[o.id] = {
          id: o.id,
          content: o.deleted_at ? "Deleted message" : o.content,
          sender_id: o.sender_id,
        };
      });
    }

    const enriched = cleaned.map((m) => ({
      ...m,
      reactions: reactionsByMessage[m.id] || [],
      reply_to: m.reply_to_id ? repliesById[m.reply_to_id] || null : null,
    }));

    return new Response(
      JSON.stringify({ thread, other, messages: enriched, my_id: me.id }),
      { status: 200 }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

    const { threadId } = params;
    const { content, image_url, reply_to_id } = await request.json();

    const hasText = content && content.trim();
    const hasImage = image_url && image_url.trim();
    if (!hasText && !hasImage) {
      return new Response(JSON.stringify({ error: "Empty message" }), { status: 400 });
    }

    const { data: me } = await admin
      .from("clients")
      .select("id, username, display_name")
      .eq("auth_id", user.id)
      .single();
    if (!me) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });

    const { data: thread } = await admin.from("message_threads").select("*").eq("id", threadId).single();
    if (!thread) return new Response(JSON.stringify({ error: "Thread not found" }), { status: 404 });
    if (thread.user_a !== me.id && thread.user_b !== me.id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    }

    const receiverId = thread.user_a === me.id ? thread.user_b : thread.user_a;
    if (await isBlockedEitherWay(me.id, receiverId)) {
      return new Response(JSON.stringify({ error: "Cannot send" }), { status: 403 });
    }

    // If reply_to_id given, verify it belongs to this thread
    let safeReplyTo = null;
    if (reply_to_id) {
      const { data: orig } = await admin
        .from("messages")
        .select("id, thread_id")
        .eq("id", reply_to_id)
        .maybeSingle();
      if (orig && orig.thread_id === threadId) safeReplyTo = reply_to_id;
    }

    const insertBody = {
      thread_id: threadId,
      sender_id: me.id,
      receiver_id: receiverId,
      content: hasText ? content.trim() : "",
      image_url: hasImage ? image_url.trim() : null,
      reply_to_id: safeReplyTo,
    };

    const { data: msg, error } = await admin
      .from("messages")
      .insert([insertBody])
      .select()
      .single();

    if (error) throw error;

    const preview = hasText ? content.trim().slice(0, 80) : "📷 Photo";

    await admin
      .from("message_threads")
      .update({
        last_message_at: new Date().toISOString(),
        last_message_preview: preview,
        last_message_sender: me.id,
      })
      .eq("id", threadId);

    await admin.from("notifications").insert([{
      client_id: receiverId,
      type: "new_message",
      message: `New message from ${me.display_name || me.username}.`,
      target_url: `/client/messages/${threadId}`,
    }]);

    const { data: receiver } = await admin
      .from("clients")
      .select("email")
      .eq("id", receiverId)
      .single();

    if (receiver?.email && (await userWantsEmails(receiverId))) {
      const tpl = newMessageEmail({
        senderName: me.display_name || me.username,
        senderUsername: me.username,
        preview,
        threadId,
      });
      await sendEmail({ to: receiver.email, subject: tpl.subject, html: tpl.html });
    }

    return new Response(JSON.stringify(msg), { status: 201 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
