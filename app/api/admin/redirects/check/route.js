import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get("path");
    if (!path) return new Response(JSON.stringify({ match: null }), { status: 200 });

    const { data } = await admin
      .from("redirects")
      .select("to_path, permanent")
      .eq("from_path", path)
      .eq("active", true)
      .maybeSingle();

    return new Response(JSON.stringify({ match: data || null }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ match: null, error: err.message }), { status: 200 });
  }
}
