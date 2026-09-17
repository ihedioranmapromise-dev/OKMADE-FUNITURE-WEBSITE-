import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  try {
    const adminKey = request.headers.get("x-admin-key");
    if (adminKey !== process.env.ADMIN_API_KEY) {
      return new Response(JSON.stringify({ error: "Unauthorized." }), {
        status: 401,
      });
    }

    const { data, error } = await supabase
      .from("clients")
      .select(
        "id, username, display_name, first_name, last_name, phone_number, work_address"
      )
      .order("display_name", { ascending: true });

    if (error) throw error;

    return new Response(JSON.stringify(data || []), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}
