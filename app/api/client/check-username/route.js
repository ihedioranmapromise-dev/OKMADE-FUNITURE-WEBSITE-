import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const u = (searchParams.get("u") || "").toLowerCase().trim();
    if (!u || u.length < 3) {
      return new Response(JSON.stringify({ available: false, error: "Too short" }), {
        status: 400,
      });
    }
    if (!/^[a-z0-9_]+$/.test(u)) {
      return new Response(
        JSON.stringify({ available: false, error: "Invalid characters" }),
        { status: 400 }
      );
    }

    const { data } = await admin
      .from("clients")
      .select("id")
      .eq("username", u)
      .maybeSingle();

    return new Response(JSON.stringify({ available: !data }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ available: false, error: err.message }), {
      status: 500,
    });
  }
}
