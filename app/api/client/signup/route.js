import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      firstName,
      lastName,
      username,
      phoneNumber,
      email,
      skill,
      workAddress,
      age,
      password,
    } = body;

    if (!firstName || !lastName || !username || !phoneNumber || !password) {
      return new Response(
        JSON.stringify({ error: "Missing required fields." }),
        { status: 400 }
      );
    }

    // Check if username exists
    const { data: existing } = await supabase
      .from("clients")
      .select("id")
      .eq("username", username)
      .single();

    if (existing) {
      return new Response(
        JSON.stringify({ error: "Username already taken." }),
        { status: 409 }
      );
    }

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);
    const displayName = `${firstName} ${lastName}`.trim();

    const { data, error } = await supabase
      .from("clients")
      .insert([
        {
          first_name: firstName,
          last_name: lastName,
          username,
          display_name: displayName,
          phone_number: phoneNumber,
          email: email || null,
          skill: skill || null,
          work_address: workAddress || null,
          age: age ? parseInt(age) : null,
          password_hash: hash,
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
    return new Response(
      JSON.stringify({ error: err.message || "Signup failed." }),
      { status: 500 }
    );
  }
}
