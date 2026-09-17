import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request, { params }) {
  try {
    const { username } = params;

    const { data, error } = await supabase
      .from("public_client_profiles")
      .select("*")
      .eq("username", username)
      .single();

    if (error || !data) {
      return new Response(JSON.stringify({ error: "Worker not found." }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify(data), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}
