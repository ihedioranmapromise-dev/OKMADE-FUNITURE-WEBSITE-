import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");
    if (!username) {
      return new Response(JSON.stringify({ error: "username required" }), { status: 400 });
    }

    const { data: target } = await admin
      .from("clients")
      .select("id, username")
      .eq("username", username)
      .maybeSingle();
    if (!target) {
      return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
    }

    const cookieStore = await cookies();
    const sb = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll() {},
        },
      }
    );
    const { data: { user } } = await sb.auth.getUser();

    if (!user) {
      const [followersRes, followingRes] = await Promise.all([
        admin.from("follows").select("*", { count: "exact", head: true }).eq("following_id", target.id),
        admin.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", target.id),
      ]);
      return new Response(
        JSON.stringify({
          isLoggedIn: false,
          isSelf: false,
          isFollowing: false,
          isBlocked: false,
          isMuted: false,
          friendStatus: "none",
          followersCount: followersRes.count || 0,
          followingCount: followingRes.count || 0,
        }),
        { status: 200 }
      );
    }

    const { data: me } = await admin
      .from("clients")
      .select("id")
      .eq("auth_id", user.id)
      .maybeSingle();
    if (!me) {
      return new Response(JSON.stringify({ error: "Profile not found" }), { status: 404 });
    }

    const isSelf = me.id === target.id;

    const [a, b] = [me.id, target.id].sort();

    const [followRes, followersRes, followingRes, friendReqRes, friendRes, blockRes, muteRes] =
      await Promise.all([
        admin.from("follows").select("id").eq("follower_id", me.id).eq("following_id", target.id).maybeSingle(),
        admin.from("follows").select("*", { count: "exact", head: true }).eq("following_id", target.id),
        admin.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", target.id),
        admin
          .from("friend_requests")
          .select("id, sender_id, receiver_id, status")
          .eq("status", "pending")
          .or(
            `and(sender_id.eq.${me.id},receiver_id.eq.${target.id}),and(sender_id.eq.${target.id},receiver_id.eq.${me.id})`
          )
          .maybeSingle(),
        admin.from("friends").select("id").eq("user_a", a).eq("user_b", b).maybeSingle(),
        admin.from("blocks").select("id").eq("blocker_id", me.id).eq("blocked_id", target.id).maybeSingle(),
        admin.from("mutes").select("id").eq("muter_id", me.id).eq("muted_id", target.id).maybeSingle(),
      ]);

    let friendStatus = "none";
    let requestDirection = null;
    if (friendRes.data) friendStatus = "friends";
    else if (friendReqRes.data) {
      friendStatus = "pending";
      requestDirection = friendReqRes.data.sender_id === me.id ? "sent" : "received";
    }

    return new Response(
      JSON.stringify({
        isLoggedIn: true,
        isSelf,
        myClientId: me.id,
        isFollowing: !!followRes.data,
        isBlocked: !!blockRes.data,
        isMuted: !!muteRes.data,
        friendStatus,
        requestDirection,
        followersCount: followersRes.count || 0,
        followingCount: followingRes.count || 0,
      }),
      { status: 200 }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
