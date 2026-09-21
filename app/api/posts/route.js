import { createSupabaseServer } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// GET: feed (okmade + followed users + self)
export async function GET(request) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    const { searchParams } = new URL(request.url);
    const authorUsername = searchParams.get("author"); // optional – specific profile feed

    let authorIds = [];

    if (authorUsername) {
      // Specific author feed (public profile)
      const { data: author } = await admin
        .from("clients")
        .select("id")
        .eq("username", authorUsername)
        .single();
      if (!author) return new Response(JSON.stringify([]), { status: 200 });
      authorIds = [author.id];
    } else if (user) {
      // Personalized feed: okmade + who user follows + self
      const { data: me } = await admin
        .from("clients")
        .select("id")
        .eq("auth_id", user.id)
        .single();

      const { data: okmade } = await admin
        .from("clients")
        .select("id")
        .eq("is_okmade", true)
        .single();

      const { data: following } = await admin
        .from("follows")
        .select("following_id")
        .eq("follower_id", me?.id);

      authorIds = [
        okmade?.id,
        me?.id,
        ...(following?.map((f) => f.following_id) || []),
      ].filter(Boolean);
    } else {
      // Public homepage feed (no login): only OKMADE
      const { data: okmade } = await admin
        .from("clients")
        .select("id")
        .eq("is_okmade", true)
        .single();
      authorIds = [okmade?.id].filter(Boolean);
    }

    if (authorIds.length === 0) return new Response(JSON.stringify([]), { status: 200 });

    const { data: posts, error } = await admin
      .from("posts")
      .select(`
        id, author_id, content, image_urls, font_family, is_auto, auto_source,
        created_at, updated_at,
        clients:author_id (username, display_name, profile_pic, is_okmade)
      `)
      .in("author_id", authorIds)
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) throw error;

    // Attach counts
    const postsWithCounts = await Promise.all(
      (posts || []).map(async (p) => {
        const { data: reacts } = await admin
          .from("post_reactions")
          .select("reaction_type, user_id")
          .eq("post_id", p.id);

        const { count: commentCount } = await admin
          .from("post_comments")
          .select("*", { count: "exact", head: true })
          .eq("post_id", p.id);

        return {
          ...p,
          reactions: reacts || [],
          commentCount: commentCount || 0,
        };
      })
    );

    return new Response(JSON.stringify(postsWithCounts), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

// POST: create a new post
export async function POST(request) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

    const { content, image_urls, font_family } = await request.json();
    if (!content?.trim() && (!image_urls || image_urls.length === 0)) {
      return new Response(JSON.stringify({ error: "Empty post" }), { status: 400 });
    }

    const { data: me } = await admin
      .from("clients")
      .select("id")
      .eq("auth_id", user.id)
      .single();
    if (!me) return new Response(JSON.stringify({ error: "Profile not found" }), { status: 404 });

    const { data, error } = await admin
      .from("posts")
      .insert([{
        author_id: me.id,
        content: content?.trim() || null,
        image_urls: image_urls || [],
        font_family: font_family || "sans-serif",
        is_auto: false,
      }])
      .select()
      .single();

    if (error) throw error;
    return new Response(JSON.stringify(data), { status: 201 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
