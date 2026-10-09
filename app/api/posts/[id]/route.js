import { createSupabaseServer } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request, { params }) {
  try {
    const { id } = params;

    const [postRes, reactionsRes, commentsRes] = await Promise.all([
      admin
        .from("posts")
        .select(`
          id, author_id, content, image_urls, font_family, is_auto,
          created_at, updated_at, pinned,
          clients:author_id (username, display_name, profile_pic, is_okmade, verified)
        `)
        .eq("id", id)
        .maybeSingle(),
      admin
        .from("post_reactions")
        .select("reaction_type, user_id")
        .eq("post_id", id),
      admin
        .from("post_comments")
        .select("*")
        .eq("post_id", id)
        .order("created_at", { ascending: true }),
    ]);

    if (!postRes.data) {
      return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
    }

    const post = {
      ...postRes.data,
      reactions: reactionsRes.data || [],
      commentCount: (commentsRes.data || []).length,
      edited_at:
        postRes.data.updated_at && postRes.data.updated_at !== postRes.data.created_at
          ? postRes.data.updated_at
          : null,
    };

    return new Response(
      JSON.stringify({
        post,
        reactions: reactionsRes.data || [],
        comments: commentsRes.data || [],
      }),
      { status: 200 }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const { id } = params;
    const { data: me } = await admin
      .from("clients")
      .select("id")
      .eq("auth_id", user.id)
      .single();
    if (!me) {
      return new Response(JSON.stringify({ error: "Profile not found" }), { status: 404 });
    }

    const { data: post } = await admin
      .from("posts")
      .select("author_id")
      .eq("id", id)
      .single();
    if (!post) {
      return new Response(JSON.stringify({ error: "Post not found" }), { status: 404 });
    }
    if (post.author_id !== me.id) {
      return new Response(JSON.stringify({ error: "Not your post" }), { status: 403 });
    }

    const { content, font_family } = await request.json();
    const updates = { updated_at: new Date().toISOString() };
    if (content !== undefined) updates.content = content;
    if (font_family !== undefined) updates.font_family = font_family;

    const { error } = await admin.from("posts").update(updates).eq("id", id);
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const { id } = params;
    const { data: me } = await admin
      .from("clients")
      .select("id, is_okmade")
      .eq("auth_id", user.id)
      .single();
    if (!me) {
      return new Response(JSON.stringify({ error: "Profile not found" }), { status: 404 });
    }

    const { data: post } = await admin
      .from("posts")
      .select("author_id, image_urls")
      .eq("id", id)
      .single();
    if (!post) {
      return new Response(JSON.stringify({ error: "Post not found" }), { status: 404 });
    }
    if (post.author_id !== me.id && !me.is_okmade) {
      return new Response(JSON.stringify({ error: "Not allowed" }), { status: 403 });
    }

    for (const url of post.image_urls || []) {
      const path = url.split("/public/")[1];
      if (path) {
        await admin.storage.from("story-images").remove([path]);
      }
    }

    await Promise.all([
      admin.from("post_reactions").delete().eq("post_id", id),
      admin.from("post_comments").delete().eq("post_id", id),
      admin.from("post_reports").delete().eq("post_id", id),
    ]);

    await admin.from("posts").delete().eq("id", id);
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
