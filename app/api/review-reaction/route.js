import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { review_id, user_id, reaction_type } = await request.json();
    if (!review_id || !user_id || !reaction_type) {
      return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400 });
    }

    // Delete existing reaction of any type by this user on this review
    await admin
      .from("review_reactions")
      .delete()
      .eq("review_id", review_id)
      .eq("user_id", user_id);

    const { data, error } = await admin
      .from("review_reactions")
      .insert({ review_id, user_id, reaction_type })
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
