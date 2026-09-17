import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return new Response(
        JSON.stringify({ error: "Username and password required." }),
        { status: 400 }
      );
    }

    const { data: client, error } = await supabase
      .from("clients")
      .select("*")
      .eq("username", username)
      .single();

    if (error || !client) {
      return new Response(
        JSON.stringify({ error: "Invalid username or password." }),
        { status: 401 }
      );
    }

    const isValid = bcrypt.compareSync(password, client.password_hash);

    if (!isValid) {
      return new Response(
        JSON.stringify({ error: "Invalid username or password." }),
        { status: 401 }
      );
    }

    // Return only safe fields
    return new Response(
      JSON.stringify({
        success: true,
        client: {
          id: client.id,
          username: client.username,
          display_name: client.display_name,
        },
      }),
      { status: 200 }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Login failed." }),
      { status: 500 }
    );
  }
}
