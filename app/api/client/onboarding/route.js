import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { auth_id, field, value } = await request.json();

    if (!auth_id || !field || !value) {
      return new Response(
        JSON.stringify({ error: "Missing fields." }),
        { status: 400 }
      );
    }

    if (field !== "profile_pic" && field !== "cover_photo") {
      return new Response(
        JSON.stringify({ error: "Invalid field." }),
        { status: 400 }
      );
    }

    const updateData = {};
    updateData[field] = value;

    const { error } = await supabase
      .from("clients")
      .update(updateData)
      .eq("auth_id", auth_id);

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}
