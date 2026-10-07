import { createSupabaseServer } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/send-email";
import { friendRequestEmail, friendAcceptedEmail } from "@/lib/email-templates";

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

export async function POST(request) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

    const { action, target_username, request_id } = await request.json();
    const { data: me } = await admin
      .from("clients")
      .select("id, username, display_name, email")
      .eq("auth_id", user.id)
      .single();
    if (!me) return new Response(JSON.stringify({ error: "Profile not found" }), { status: 404 });

    if (action === "send") {
      const { data: target } = await admin
        .from("clients")
        .select("id, username, display_name, email")
        .eq("username", target_username)
        .single();
      if (!target) return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
      if (target.id === me.id) return new Response(JSON.stringify({ error: "Cannot add yourself" }), { status: 400 });
      if (await isBlockedEitherWay(me.id, target.id)) {
        return new Response(JSON.stringify({ error: "Cannot send friend request" }), { status: 403 });
      }

      const [a, b] = [me.id, target.id].sort();
      const { data: alreadyFriends } = await admin
        .from("friends")
        .select("id")
        .eq("user_a", a)
        .eq("user_b", b)
        .maybeSingle();
      if (alreadyFriends) return new Response(JSON.stringify({ error: "Already friends" }), { status: 400 });

      const { data: existingReq } = await admin
        .from("friend_requests")
        .select("id")
        .eq("sender_id", me.id)
        .eq("receiver_id", target.id)
        .eq("status", "pending")
        .maybeSingle();
      if (existingReq) return new Response(JSON.stringify({ status: "pending" }), { status: 200 });

      await admin.from("friend_requests").insert([{
        sender_id: me.id,
        receiver_id: target.id,
        status: "pending",
      }]);

      if (target.email && (await userWantsEmails(target.id))) {
        const tpl = friendRequestEmail({
          senderName: me.display_name || me.username,
          senderUsername: me.username,
        });
        await sendEmail({ to: target.email, subject: tpl.subject, html: tpl.html });
      }

      return new Response(JSON.stringify({ status: "pending" }), { status: 201 });
    }

    if (action === "accept" || action === "decline") {
      const { data: req } = await admin
        .from("friend_requests")
        .select("*")
        .eq("id", request_id)
        .eq("receiver_id", me.id)
        .eq("status", "pending")
        .single();
      if (!req) return new Response(JSON.stringify({ error: "Request not found" }), { status: 404 });

      if (action === "accept") {
        await admin.from("friend_requests").update({ status: "accepted" }).eq("id", request_id);
        const [a, b] = [req.sender_id, req.receiver_id].sort();
        await admin.from("friends").insert([{ user_a: a, user_b: b }]);

        const { data: sender } = await admin
          .from("clients")
          .select("email")
          .eq("id", req.sender_id)
          .single();
        if (sender?.email && (await userWantsEmails(req.sender_id))) {
          const tpl = friendAcceptedEmail({
            accepterName: me.display_name || me.username,
            accepterUsername: me.username,
          });
          await sendEmail({ to: sender.email, subject: tpl.subject, html: tpl.html });
        }

        return new Response(JSON.stringify({ status: "friends" }), { status: 200 });
      } else {
        await admin.from("friend_requests").update({ status: "declined" }).eq("id", request_id);
        return new Response(JSON.stringify({ status: "declined" }), { status: 200 });
      }
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

export async function GET(request) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

    const { data: me } = await admin.from("clients").select("id").eq("auth_id", user.id).single();
    if (!me) return new Response(JSON.stringify([]), { status: 200 });

    const { data: incoming } = await admin
      .from("friend_requests")
      .select("id, created_at, clients:sender_id (username, display_name, profile_pic)")
      .eq("receiver_id", me.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    return new Response(JSON.stringify(incoming || []), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
