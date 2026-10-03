import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { product_id, user_id, liked } = await request.json();
    if (!product_id || !user_id) {
      return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400 });
    }

    if (liked) {
      const { error } = await admin
        .from("product_likes")
        .insert({ product_id, user_id });
      if (error && !error.message.includes("duplicate")) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
      }
    } else {
      const { error } = await admin
        .from("product_likes")
        .delete()
        .eq("product_id", product_id)
        .eq("user_id", user_id);
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
      }
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
