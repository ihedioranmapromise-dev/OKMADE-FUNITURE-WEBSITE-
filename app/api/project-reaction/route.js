import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { project_id, user_id, reaction_type } = await request.json();
    if (!project_id || !user_id || !reaction_type) {
      return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400 });
    }

    // Remove any existing reaction by this user on this project
    await admin
      .from("story_reactions")
      .delete()
      .eq("story_id", project_id)
      .eq("user_id", user_id);

    const { error } = await admin
      .from("story_reactions")
      .insert({ story_id: project_id, user_id, reaction_type });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
