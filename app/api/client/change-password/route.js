import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const clientId = request.headers.get("x-client-id");
    if (!clientId) {
      return new Response(JSON.stringify({ error: "Unauthorized." }), {
        status: 401,
      });
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return new Response(
        JSON.stringify({ error: "All fields are required." }),
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return new Response(
        JSON.stringify({ error: "New password must be at least 6 characters." }),
        { status: 400 }
      );
    }

    const { data: client } = await supabase
      .from("clients")
      .select("password_hash")
      .eq("id", clientId)
      .single();

    if (!client) {
      return new Response(JSON.stringify({ error: "Client not found." }), {
        status: 404,
      });
    }

    const isValid = bcrypt.compareSync(currentPassword, client.password_hash);
    if (!isValid) {
      return new Response(
        JSON.stringify({ error: "Current password is incorrect." }),
        { status: 401 }
      );
    }

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(newPassword, salt);

    await supabase
      .from("clients")
      .update({ password_hash: hash })
      .eq("id", clientId);

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}
