import { createSupabaseServer } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");

    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    const { data: target } = await admin
      .from("clients")
      .select("id, followers_count:follows!following_id(count)")
      .eq("username", username)
      .single();

    // Follow count
    const { count: followersCount } = await admin
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", target?.id);

    const { count: followingCount } = await admin
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", target?.id);

    if (!user) {
      return new Response(JSON.stringify({
        isLoggedIn: false,
        isFollowing: false,
        friendStatus: "none",
        followersCount: followersCount || 0,
        followingCount: followingCount || 0,
      }), { status: 200 });
    }

    const { data: me } = await admin.from("clients").select("id").eq("auth_id", user.id).single();
    if (!me || !target) {
      return new Response(JSON.stringify({
        isLoggedIn: true,
        isFollowing: false,
        friendStatus: "none",
        followersCount: followersCount || 0,
        followingCount: followingCount || 0,
      }), { status: 200 });
    }

    const isSelf = me.id === target.id;

    const { data: followRow } = await admin
      .from("follows")
      .select("id")
      .eq("follower_id", me.id)
      .eq("following_id", target.id)
      .single();

    // Friend status
    let friendStatus = "none";
    let requestId = null;
    let requestDirection = null;

    if (!isSelf) {
      const { data: friends } = await admin
        .from("friends")
        .select("id")
        .or(`and(user_a.eq.${me.id},user_b.eq.${target.id}),and(user_a.eq.${target.id},user_b.eq.${me.id})`)
        .single();
      if (friends) friendStatus = "friends";
      else {
        const { data: req } = await admin
          .from("friend_requests")
          .select("id, sender_id")
          .or(`and(sender_id.eq.${me.id},receiver_id.eq.${target.id}),and(sender_id.eq.${target.id},receiver_id.eq.${me.id})`)
          .eq("status", "pending")
          .single();
        if (req) {
          friendStatus = "pending";
          requestId = req.id;
          requestDirection = req.sender_id === me.id ? "sent" : "received";
        }
      }
    }

    return new Response(JSON.stringify({
      isLoggedIn: true,
      isSelf,
      isFollowing: !!followRow,
      friendStatus,
      requestId,
      requestDirection,
      followersCount: followersCount || 0,
      followingCount: followingCount || 0,
      myClientId: me.id,
    }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
