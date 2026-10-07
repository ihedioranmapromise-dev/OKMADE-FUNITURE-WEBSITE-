import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request, { params }) {
  try {
    const { username } = params;

    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select(
        "id, username, display_name, first_name, last_name, bio, skill, profile_pic, cover_photo, work_address, calling_phone, age, whatsapp_url, facebook_url, tiktok_url, instagram_url, twitter_url, is_okmade, verified"
      )
      .eq("username", username)
      .maybeSingle();

    if (clientError || !client) {
      return new Response(JSON.stringify({ error: "Client not found." }), {
        status: 404,
      });
    }

    const { data: projects } = await supabase
      .from("projects")
      .select("id, token_string, work_description, created_at, city")
      .eq("client_id", client.id)
      .eq("status", "killed")
      .order("created_at", { ascending: false });

    return new Response(
      JSON.stringify({
        client,
        projects: projects || [],
      }),
      { status: 200 }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}
