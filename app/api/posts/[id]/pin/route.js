import { createSupabaseServer } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request, { params }) {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const { id } = params;

    const { data: me } = await admin
      .from("clients")
      .select("id")
      .eq("auth_id", user.id)
      .maybeSingle();
    if (!me) {
      return new Response(JSON.stringify({ error: "Profile not found" }), { status: 404 });
    }

    const { data: post } = await admin
      .from("posts")
      .select("id, author_id, pinned")
      .eq("id", id)
      .maybeSingle();
    if (!post) {
      return new Response(JSON.stringify({ error: "Post not found" }), { status: 404 });
    }
    if (post.author_id !== me.id) {
      return new Response(JSON.stringify({ error: "Not your post" }), { status: 403 });
    }

    // Toggle: if currently pinned, unpin. If not pinned, pin and unpin others.
    if (post.pinned) {
      await admin.from("posts").update({ pinned: false }).eq("id", id);
      return new Response(JSON.stringify({ pinned: false }), { status: 200 });
    }

    // Unpin all my other posts first
    await admin
      .from("posts")
      .update({ pinned: false })
      .eq("author_id", me.id)
      .eq("pinned", true);

    // Pin this one
    await admin.from("posts").update({ pinned: true }).eq("id", id);

    return new Response(JSON.stringify({ pinned: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
