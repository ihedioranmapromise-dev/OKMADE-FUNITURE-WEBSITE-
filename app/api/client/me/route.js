import { createSupabaseServer } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET() {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const { data, error } = await adminSupabase
      .from("clients")
      .select(
        "id, auth_id, username, display_name, first_name, last_name, bio, skill, phone, phone_number, calling_phone, email, work_address, age, profile_pic, cover_photo, whatsapp_url, facebook_url, tiktok_url, instagram_url, is_okmade"
      )
      .eq("auth_id", user.id)
      .single();

    if (error || !data) {
      return new Response(JSON.stringify({ error: "Profile not found" }), { status: 404 });
    }

    return new Response(JSON.stringify(data), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
