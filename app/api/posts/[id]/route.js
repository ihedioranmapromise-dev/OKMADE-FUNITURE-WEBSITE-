import { createSupabaseServer } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const { data: post, error } = await admin
      .from("posts")
      .select(`
        id, author_id, content, image_urls, font_family, is_auto,
        created_at, updated_at,
        clients:author_id (username, display_name, profile_pic, is_okmade)
      `)
      .eq("id", id)
      .single();
    if (error || !post) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });

    const { data: reacts } = await admin
      .from("post_reactions")
      .select("reaction_type, user_id")
      .eq("post_id", id);

    const { data: comments } = await admin
      .from("post_comments")
      .select("*")
      .eq("post_id", id)
      .order("created_at", { ascending: true });

    return new Response(JSON.stringify({ post, reactions: reacts || [], comments: comments || [] }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

    const { id } = params;
    const { data: me } = await admin.from("clients").select("id").eq("auth_id", user.id).single();
    if (!me) return new Response(JSON.stringify({ error: "Profile not found" }), { status: 404 });

    const { data: post } = await admin.from("posts").select("author_id, image_urls").eq("id", id).single();
    if (!post) return new Response(JSON.stringify({ error: "Post not found" }), { status: 404 });
    if (post.author_id !== me.id) {
      return new Response(JSON.stringify({ error: "Not your post" }), { status: 403 });
    }

    // Delete images from storage
    for (const url of post.image_urls || []) {
      const path = url.split("/public/")[1];
      if (path) {
        const bucket = path.split("/")[0] === "posts" ? "story-images" : "story-images";
        await admin.storage.from(bucket).remove([path]);
      }
    }

    await admin.from("posts").delete().eq("id", id);
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
