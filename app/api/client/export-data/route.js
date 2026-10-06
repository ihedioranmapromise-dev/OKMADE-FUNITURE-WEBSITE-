import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  try {
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
      return new Response(JSON.stringify({ error: "Not logged in" }), { status: 401 });
    }

    const { data: client } = await admin
      .from("clients")
      .select("*")
      .eq("auth_id", user.id)
      .maybeSingle();
    if (!client) {
      return new Response(JSON.stringify({ error: "Profile not found" }), { status: 404 });
    }

    const [postsRes, commentsRes, reactionsRes, followsRes, friendsRes, projectsRes, referralsRes] =
      await Promise.all([
        admin.from("posts").select("*").eq("author_id", client.id),
        admin.from("post_comments").select("*").or(`author_id.eq.${client.id}`),
        admin.from("post_reactions").select("*").eq("user_id", client.id),
        admin.from("follows").select("*").eq("follower_id", client.id),
        admin.from("friends").select("*").or(`user_a.eq.${client.id},user_b.eq.${client.id}`),
        admin.from("projects").select("*").eq("client_id", client.id),
        admin.from("referrals").select("*").eq("referrer_id", client.id),
      ]);

    // Strip sensitive fields
    const { password_hash, deletion_cancel_token, ...safeClient } = client;

    const payload = {
      exported_at: new Date().toISOString(),
      account: safeClient,
      auth: {
        email: user.email,
        created_at: user.created_at,
        last_sign_in: user.last_sign_in_at,
      },
      posts: postsRes.data || [],
      comments: commentsRes.data || [],
      reactions: reactionsRes.data || [],
      following: followsRes.data || [],
      friends: friendsRes.data || [],
      projects: projectsRes.data || [],
      referrals_made: referralsRes.data || [],
    };

    return new Response(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="okmade_data_${client.username}_${Date.now()}.json"`,
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
