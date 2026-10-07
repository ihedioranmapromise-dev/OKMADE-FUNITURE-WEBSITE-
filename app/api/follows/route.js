import { createSupabaseServer } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/send-email";
import { newFollowerEmail } from "@/lib/email-templates";

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

    const { target_username } = await request.json();
    const { data: me } = await admin
      .from("clients")
      .select("id, username, display_name")
      .eq("auth_id", user.id)
      .single();
    const { data: target } = await admin
      .from("clients")
      .select("id, email, is_okmade")
      .eq("username", target_username)
      .single();
    if (!me || !target) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
    if (me.id === target.id) return new Response(JSON.stringify({ error: "Cannot follow yourself" }), { status: 400 });
    if (await isBlockedEitherWay(me.id, target.id)) {
      return new Response(JSON.stringify({ error: "Cannot follow this user" }), { status: 403 });
    }

    const { data: existing } = await admin
      .from("follows")
      .select("id")
      .eq("follower_id", me.id)
      .eq("following_id", target.id)
      .maybeSingle();

    if (existing) {
      await admin.from("follows").delete().eq("id", existing.id);
      return new Response(JSON.stringify({ following: false }), { status: 200 });
    }

    await admin.from("follows").insert([{ follower_id: me.id, following_id: target.id }]);

    await admin.from("notifications").insert([{
      client_id: target.id,
      type: "new_follower",
      message: `${me.display_name || me.username} started following you.`,
      target_url: `/client/${me.username}`,
    }]);

    if (target.email && (await userWantsEmails(target.id))) {
      const tpl = newFollowerEmail({
        followerName: me.display_name || me.username,
        followerUsername: me.username,
      });
      await sendEmail({ to: target.email, subject: tpl.subject, html: tpl.html });
    }

    return new Response(JSON.stringify({ following: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

export async function GET(request) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ following: [] }), { status: 200 });

    const { data: me } = await admin.from("clients").select("id").eq("auth_id", user.id).single();
    if (!me) return new Response(JSON.stringify({ following: [] }), { status: 200 });

    const { data } = await admin
      .from("follows")
      .select("following_id, clients:following_id (username, display_name, profile_pic)")
      .eq("follower_id", me.id);

    const following = (data || []).map((f) => ({
      username: f.clients?.username,
      display_name: f.clients?.display_name,
      profile_pic: f.clients?.profile_pic,
    }));

    return new Response(JSON.stringify({ following }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
