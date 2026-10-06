import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getClientUser() {
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
  if (!user) return null;
  const { data: client } = await admin
    .from("clients")
    .select("id, username, display_name, profile_pic, is_okmade, verified, suspended")
    .eq("auth_id", user.id)
    .maybeSingle();
  return client;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const author = searchParams.get("author");

    let query = admin
      .from("posts")
      .select(`
        id, author_id, content, image_urls, font_family, is_auto,
        created_at, updated_at, requires_approval, approved,
        clients:author_id (id, username, display_name, profile_pic, is_okmade, verified)
      `)
      .eq("status", "published")
      .eq("approved", true)
      .order("created_at", { ascending: false })
      .limit(50);

    if (author) {
      query = admin
        .from("posts")
        .select(`
          id, author_id, content, image_urls, font_family, is_auto,
          created_at, updated_at, requires_approval, approved,
          clients:author_id (id, username, display_name, profile_pic, is_okmade, verified)
        `)
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(50);
    }

    const { data: posts } = await query;
    let list = posts || [];

    // Filter out muted/blocked users if I'm logged in and viewing the general feed
    if (!author) {
      const me = await getClientUser();
      if (me) {
        const [mutesRes, blocksRes] = await Promise.all([
          admin.from("mutes").select("muted_id").eq("muter_id", me.id),
          admin.from("blocks").select("blocked_id").eq("blocker_id", me.id),
        ]);
        const hideSet = new Set([
          ...(mutesRes.data || []).map((m) => m.muted_id),
          ...(blocksRes.data || []).map((b) => b.blocked_id),
        ]);
        if (hideSet.size > 0) {
          list = list.filter((p) => !hideSet.has(p.author_id));
        }
      }
    }

    if (list.length === 0) {
      return new Response(JSON.stringify([]), { status: 200 });
    }

    const ids = list.map((p) => p.id);
    const [reactionsRes, commentsRes] = await Promise.all([
      admin.from("post_reactions").select("post_id, reaction_type, user_id").in("post_id", ids),
      admin.from("post_comments").select("post_id").in("post_id", ids),
    ]);

    const reactionsByPost = {};
    (reactionsRes.data || []).forEach((r) => {
      if (!reactionsByPost[r.post_id]) reactionsByPost[r.post_id] = [];
      reactionsByPost[r.post_id].push(r);
    });

    const commentCounts = {};
    (commentsRes.data || []).forEach((c) => {
      commentCounts[c.post_id] = (commentCounts[c.post_id] || 0) + 1;
    });

    const enriched = list.map((p) => ({
      ...p,
      reactions: reactionsByPost[p.id] || [],
      commentCount: commentCounts[p.id] || 0,
      edited_at: p.updated_at && p.updated_at !== p.created_at ? p.updated_at : null,
    }));

    return new Response(JSON.stringify(enriched), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

export async function POST(request) {
  try {
    const client = await getClientUser();
    if (!client) {
      return new Response(JSON.stringify({ error: "Not logged in" }), { status: 401 });
    }
    if (client.suspended) {
      return new Response(JSON.stringify({ error: "Account suspended" }), { status: 403 });
    }

    const { content, image_urls, font_family } = await request.json();
    if (!content?.trim() && (!image_urls || image_urls.length === 0)) {
      return new Response(JSON.stringify({ error: "Empty post" }), { status: 400 });
    }

    const { data: settings } = await admin
      .from("user_settings")
      .select("auto_approve_posts")
      .eq("user_id", client.id)
      .maybeSingle();

    const autoApprove = settings?.auto_approve_posts ?? true;
    const isVerified = client.is_okmade || client.verified;
    const requiresApproval = !autoApprove && !isVerified;
    const approved = !requiresApproval;

    const { data, error } = await admin
      .from("posts")
      .insert({
        author_id: client.id,
        content: content?.trim() || "",
        image_urls: image_urls || [],
        font_family: font_family || "sans-serif",
        is_auto: false,
        status: "published",
        requires_approval: requiresApproval,
        approved,
      })
      .select()
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    if (requiresApproval) {
      await admin.from("admin_inbox").insert({
        type: "post_pending",
        title: `Post pending approval from @${client.username}`,
        body: content?.slice(0, 120) || "(image only)",
        link: "/admin/dashboard?tab=pending-posts",
      });
    }

    return new Response(JSON.stringify(data), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
