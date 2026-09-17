import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { username } = await request.json();

    if (!username) {
      return new Response(JSON.stringify({ error: "Username required." }), {
        status: 400,
      });
    }

    const { data: client } = await supabase
      .from("clients")
      .select("id")
      .eq("username", username)
      .single();

    if (!client) {
      return new Response(
        JSON.stringify({ error: "No account found with that username." }),
        { status: 404 }
      );
    }

    // Generate 6-digit code
    const token = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const { error } = await supabase.from("password_resets").insert({
      client_id: client.id,
      token,
      expires_at: expiresAt,
    });

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, token }), {
      status: 200,
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Failed to generate code." }),
      { status: 500 }
    );
  }
}
