import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { product_id, user_name, rating, comment } = await request.json();
    if (!product_id || !user_name || !rating) {
      return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400 });
    }

    const { data, error } = await admin
      .from("ratings")
      .insert({ product_id, user_name, rating, comment })
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
