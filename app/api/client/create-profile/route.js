import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      auth_id,
      first_name,
      last_name,
      username,
      email,
      phone_number,
      skill,
      work_address,
      age,
    } = body;

    if (!auth_id || !username || !email) {
      return new Response(
        JSON.stringify({ error: "Missing required fields." }),
        { status: 400 }
      );
    }

    // Check username uniqueness
    const { data: existing } = await supabase
      .from("clients")
      .select("id")
      .eq("username", username)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ error: "Username already taken." }),
        { status: 409 }
      );
    }

    const displayName = `${first_name} ${last_name}`.trim();

    const { data, error } = await supabase
      .from("clients")
      .insert([
        {
          auth_id,
          first_name,
          last_name,
          username,
          display_name: displayName,
          email,
          phone_number,
          skill: skill || null,
          work_address: work_address || null,
          age: age ? parseInt(age) : null,
        },
      ])
      .select("id, username")
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, client: data }),
      { status: 201 }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}
