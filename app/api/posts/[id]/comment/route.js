import { createSupabaseServer } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { content, author_name, author_email, parent_id } = body;

    if (!content?.trim()) {
      return new Response(JSON.stringify({ error: "Empty comment" }), { status: 400 });
    }

    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    let authorId = null;
    let finalName = author_name;
    let isGuest = true;

    if (user) {
      const { data: me } = await admin
        .from("clients")
        .select("id, display_name, username")
        .eq("auth_id", user.id)
        .single();
      if (me) {
        authorId = me.id;
        finalName = me.display_name || me.username;
        isGuest = false;
      }
    }

    if (!finalName?.trim()) {
      return new Response(JSON.stringify({ error: "Name required" }), { status: 400 });
    }

    const { data, error } = await admin
      .from("post_comments")
      .insert([{
        post_id: id,
        parent_id: parent_id || null,
        author_id: authorId,
        author_name: finalName,
        author_email: author_email || null,
        is_guest: isGuest,
        content: content.trim(),
      }])
      .select()
      .single();

    if (error) throw error;
    return new Response(JSON.stringify(data), { status: 201 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
