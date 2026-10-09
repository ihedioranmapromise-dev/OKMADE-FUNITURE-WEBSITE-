import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getClientUser() {
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
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return null;
  const { data: client } = await admin
    .from("clients")
    .select("id, username, display_name, suspended")
    .eq("auth_id", user.id)
    .maybeSingle();
  return client;
}

export async function POST(request) {
  try {
    const client = await getClientUser();
    if (!client) {
      return new Response(JSON.stringify({ error: "Not logged in" }), { status: 401 });
    }
    if (client.suspended) {
      return new Response(JSON.stringify({ error: "Account suspended" }), { status: 403 });
    }

    const { content, image_url, auto_source } = await request.json();

    if (!image_url || typeof image_url !== "string") {
      return new Response(JSON.stringify({ error: "Image required" }), { status: 400 });
    }
    if (!["profile_pic", "cover_photo"].includes(auto_source)) {
      return new Response(JSON.stringify({ error: "Invalid auto_source" }), { status: 400 });
    }

    const safeContent = (content || "").trim().slice(0, 500) ||
      (auto_source === "cover_photo"
        ? "I just updated my cover photo."
        : "I just updated my profile picture.");

    const { data, error } = await admin
      .from("posts")
      .insert({
        author_id: client.id,
        content: safeContent,
        image_urls: [image_url],
        font_family: "sans-serif",
        is_auto: true,
        auto_source,
        auto_source_id: client.id,
        status: "published",
        requires_approval: false,
        approved: true,
      })
      .select()
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify(data), { status: 201 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
