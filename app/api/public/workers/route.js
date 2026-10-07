import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("clients")
      .select(
        "id, username, display_name, first_name, last_name, bio, skill, profile_pic, cover_photo, work_address, calling_phone, age, whatsapp_url, facebook_url, tiktok_url, instagram_url, twitter_url, is_okmade, verified"
      )
      .order("display_name", { ascending: true, nullsFirst: false });

    if (error) throw error;

    return new Response(JSON.stringify(data || []), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}
