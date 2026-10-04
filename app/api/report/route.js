import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { post_id, comment_id, reason, details } = await request.json();
    if (!reason || (!post_id && !comment_id)) {
      return new Response(
        JSON.stringify({ error: "Missing reason or target" }),
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const sb = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {},
        },
      }
    );

    const { data: { user } } = await sb.auth.getUser();
    let reporterId = null;
    if (user) {
      const { data: client } = await admin
        .from("clients")
        .select("id")
        .eq("auth_id", user.id)
        .maybeSingle();
      if (client) reporterId = client.id;
    }

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const { error } = await admin.from("post_reports").insert({
      post_id: post_id || null,
      comment_id: comment_id || null,
      reporter_id: reporterId,
      reporter_ip: ip,
      reason,
      details: details || null,
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
