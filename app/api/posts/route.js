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
    const author = searchParams.get("author");

    let query = admin
      .from("posts")
      .select(`
        id, author_id, content, image_urls, font_family, is_auto,
        created_at, updated_at, requires_approval, approved,
        clients:author_id (id, username, display_name, profile_pic, is_okmade, verified)
      `)
      .order("created_at", { ascending: false })
      .limit(50);

    if (author) {
      const { data: authorClient, error: authorErr } = await admin
        .from("clients")
        .select("id")
        .eq("username", author)
        .maybeSingle();

      console.log("[posts GET] author param =", author, "authorClient =", authorClient, "error =", authorErr);

      if (!authorClient) {
        return new Response(JSON.stringify([]), { status: 200 });
      }

      query = query.eq("author_id", authorClient.id);
    }

    const { data: posts, error: postsErr } = await query;

    console.log("[posts GET] posts found =", (posts || []).length, "error =", postsErr);

    if (postsErr) {
      return new Response(JSON.stringify({ error: postsErr.message }), { status: 500 });
    }

    let list = posts || [];

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
    console.log("[posts GET] catch error =", err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
