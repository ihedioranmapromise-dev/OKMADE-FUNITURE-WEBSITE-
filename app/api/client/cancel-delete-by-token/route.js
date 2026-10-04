import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { token } = await request.json();
    if (!token) {
      return new Response(JSON.stringify({ error: "Missing token" }), { status: 400 });
    }

    const { data: client } = await admin
      .from("clients")
      .select("id")
      .eq("deletion_cancel_token", token)
      .maybeSingle();

    if (!client) {
      return new Response(JSON.stringify({ error: "Invalid or expired link" }), { status: 404 });
    }

    const { error } = await admin
      .from("clients")
      .update({
        deletion_requested_at: null,
        deletion_scheduled_for: null,
        deletion_reason: null,
        deletion_cancel_token: null,
      })
      .eq("id", client.id);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
