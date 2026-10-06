import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  try {
    const now = new Date().toISOString();

    const { data: dueClients } = await admin
      .from("clients")
      .select("id, auth_id, username, display_name")
      .not("deletion_scheduled_for", "is", null)
      .lte("deletion_scheduled_for", now);

    if (!dueClients || dueClients.length === 0) {
      return new Response(JSON.stringify({ processed: 0 }), { status: 200 });
    }

    let processed = 0;
    let failed = 0;

    for (const c of dueClients) {
      try {
        // Delete related rows
        await Promise.all([
          admin.from("posts").delete().eq("author_id", c.id),
          admin.from("post_comments").delete().eq("author_id", c.id),
          admin.from("post_reactions").delete().eq("user_id", c.id),
          admin.from("follows").delete().or(`follower_id.eq.${c.id},following_id.eq.${c.id}`),
          admin.from("friends").delete().or(`user_a.eq.${c.id},user_b.eq.${c.id}`),
          admin.from("friend_requests").delete().or(`from_id.eq.${c.id},to_id.eq.${c.id}`),
          admin.from("blocks").delete().or(`blocker_id.eq.${c.id},blocked_id.eq.${c.id}`),
          admin.from("mutes").delete().or(`muter_id.eq.${c.id},muted_id.eq.${c.id}`),
          admin.from("project_likes").delete().eq("user_id", c.id),
          admin.from("product_likes").delete().eq("user_id", c.id),
          admin.from("notifications").delete().eq("client_id", c.id),
          admin.from("push_subscriptions").delete().eq("client_id", c.id),
          admin.from("user_settings").delete().eq("user_id", c.id),
          admin.from("referrals").delete().or(`referrer_id.eq.${c.id},referred_id.eq.${c.id}`),
        ]);

        // Delete client row
        await admin.from("clients").delete().eq("id", c.id);

        // Delete auth user
        if (c.auth_id) {
          await admin.auth.admin.deleteUser(c.auth_id);
        }

        await admin.from("admin_inbox").insert({
          type: "deletion_completed",
          title: `Account deleted: @${c.username}`,
          body: `${c.display_name || c.username}'s account was permanently deleted after the 7-day window.`,
        });

        processed++;
      } catch {
        failed++;
      }
    }

    return new Response(
      JSON.stringify({ processed, failed, total: dueClients.length }),
      { status: 200 }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
