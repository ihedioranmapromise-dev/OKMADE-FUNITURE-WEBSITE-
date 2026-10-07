import { createSupabaseServer } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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

    const threadsWithUsers = await Promise.all(
      (threads || []).map(async (t) => {
        if (t.is_group) {
          const { count: unread } = await admin
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("thread_id", t.id)
            .eq("receiver_id", me.id)
            .is("read_at", null);
          return { ...t, other: null, unread: unread || 0 };
        }
        const otherId = t.user_a === me.id ? t.user_b : t.user_a;
        const [otherRes, unreadRes] = await Promise.all([
          admin.from("clients").select("username, display_name, profile_pic").eq("id", otherId).maybeSingle(),
          admin
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("thread_id", t.id)
            .eq("receiver_id", me.id)
            .is("read_at", null),
        ]);
        return { ...t, other: otherRes.data, unread: unreadRes.count || 0 };
      })
    );

    return new Response(JSON.stringify(threadsWithUsers), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

export async function POST(request) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

    const { username, first_message } = await request.json();
    const { data: me } = await admin.from("clients").select("id, username, display_name").eq("auth_id", user.id).single();
    const { data: other } = await admin.from("clients").select("id, username, display_name").eq("username", username).single();

    if (!me || !other) return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
    if (me.id === other.id) return new Response(JSON.stringify({ error: "Cannot message yourself" }), { status: 400 });

    if (await isBlockedEitherWay(me.id, other.id)) {
      return new Response(JSON.stringify({ error: "Cannot message this user" }), { status: 403 });
    }

    const [a, b] = [me.id, other.id].sort();
    const { data: friends } = await admin
      .from("friends")
      .select("id")
      .eq("user_a", a)
      .eq("user_b", b)
      .maybeSingle();

    // Not friends → create a message request instead of a thread
    if (!friends) {
      const { data: existingRequest } = await admin
        .from("message_requests")
        .select("id, status")
        .eq("from_id", me.id)
        .eq("to_id", other.id)
        .maybeSingle();

      if (existingRequest) {
        if (existingRequest.status === "pending") {
          return new Response(
            JSON.stringify({ request_sent: true, message: "Your message request is pending." }),
            { status: 200 }
          );
        }
        if (existingRequest.status === "declined") {
          return new Response(
            JSON.stringify({ error: "This user declined your request." }),
            { status: 403 }
          );
        }
      }

      await admin.from("message_requests").insert({
        from_id: me.id,
        to_id: other.id,
        first_message: (first_message || "").slice(0, 500) || null,
        status: "pending",
      });

      await admin.from("admin_inbox").insert({
        type: "message_request",
        title: `Message request from @${me.username}`,
        body: first_message ? String(first_message).slice(0, 200) : "(no message)",
        link: "/admin/dashboard?tab=message-requests",
      });

      return new Response(
        JSON.stringify({
          request_sent: true,
          message: "Message request sent. They'll need to accept before you can chat.",
        }),
        { status: 200 }
      );
    }

    // Friends → create or find thread as before
    const { data: existing } = await admin
      .from("message_threads")
      .select("id")
      .eq("user_a", a)
      .eq("user_b", b)
      .maybeSingle();

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
