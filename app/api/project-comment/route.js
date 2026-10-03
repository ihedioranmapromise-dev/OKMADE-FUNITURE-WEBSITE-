import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { project_id, parent_id, author_name, author_email, message } = await request.json();
    if (!project_id || !author_name || !message) {
      return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400 });
    }

    const { data, error } = await admin
      .from("public_comments")
      .insert({
        project_id,
        parent_id: parent_id || null,
        author_name,
        author_email: author_email || null,
        message,
      })
      .select()
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify(data), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
