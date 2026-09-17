import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// GET full profile (requires clientId header)
export async function GET(request) {
  try {
    const clientId = request.headers.get("x-client-id");
    if (!clientId) {
      return new Response(JSON.stringify({ error: "Unauthorized." }), {
        status: 401,
      });
    }

    const { data, error } = await supabase
      .from("clients")
      .select(
        "id, username, display_name, first_name, last_name, bio, skill, phone, phone_number, calling_phone, email, work_address, age, profile_pic, whatsapp_url, facebook_url, tiktok_url, instagram_url"
      )
      .eq("id", clientId)
      .single();

    if (error || !data) {
      return new Response(JSON.stringify({ error: "Profile not found." }), {
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

// PUT update profile
export async function PUT(request) {
  try {
    const clientId = request.headers.get("x-client-id");
    if (!clientId) {
      return new Response(JSON.stringify({ error: "Unauthorized." }), {
        status: 401,
      });
    }

    const body = await request.json();
    const {
      first_name,
      last_name,
      username,
      age,
      skill,
      phone_number,
      calling_phone,
      email,
      work_address,
      display_name,
      bio,
      whatsapp_url,
      facebook_url,
      tiktok_url,
      instagram_url,
    } = body;

    const { error } = await supabase
      .from("clients")
      .update({
        first_name,
        last_name,
        username,
        age: age ? parseInt(age) : null,
        skill,
        phone_number,
        calling_phone,
        email,
        work_address,
        display_name,
        bio,
        whatsapp_url,
        facebook_url,
        tiktok_url,
        instagram_url,
      })
      .eq("id", clientId);

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}
