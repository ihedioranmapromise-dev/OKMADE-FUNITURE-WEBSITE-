import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { token, newPassword } = await request.json();

    if (!token || !newPassword) {
      return new Response(
        JSON.stringify({ error: "Token and new password required." }),
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return new Response(
        JSON.stringify({ error: "Password must be at least 6 characters." }),
        { status: 400 }
      );
    }

    const { data: reset, error: findError } = await supabase
      .from("password_resets")
      .select("*")
      .eq("token", token)
      .eq("used", false)
      .single();

    if (findError || !reset) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired reset code." }),
        { status: 401 }
      );
    }

    if (new Date() > new Date(reset.expires_at)) {
      return new Response(
        JSON.stringify({ error: "This reset code has expired." }),
        { status: 401 }
      );
    }

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(newPassword, salt);

    await supabase
      .from("clients")
      .update({ password_hash: hash })
      .eq("id", reset.client_id);

    await supabase
      .from("password_resets")
      .update({ used: true })
      .eq("id", reset.id);

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Reset failed." }),
      { status: 500 }
    );
  }
}
