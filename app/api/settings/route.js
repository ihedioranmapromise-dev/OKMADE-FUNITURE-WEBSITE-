import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getMe() {
  const cookieStore = await cookies();
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() {},
      },
    }
  );
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const { data: client } = await admin
    .from("clients")
    .select("id")
    .eq("auth_id", user.id)
    .maybeSingle();
  return client;
}

export async function GET(request) {
  try {
    const me = await getMe();
    if (!me) return new Response(JSON.stringify({ error: "Not logged in" }), { status: 401 });

    const { data } = await admin
      .from("user_settings")
      .select("*")
      .eq("user_id", me.id)
      .maybeSingle();

    if (!data) {
      // Create default row
      const { data: created } = await admin
        .from("user_settings")
        .insert({
          user_id: me.id,
          post_visibility: "public",
          message_permission: "friends",
          email_notifications: true,
          push_notifications: true,
          auto_approve_posts: true,
        })
        .select()
        .single();
      return new Response(JSON.stringify(created || {}), { status: 200 });
    }

    return new Response(JSON.stringify(data), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const me = await getMe();
    if (!me) return new Response(JSON.stringify({ error: "Not logged in" }), { status: 401 });

    const body = await request.json();
    const allowed = [
      "post_visibility",
      "message_permission",
      "email_notifications",
      "push_notifications",
      "auto_approve_posts",
    ];
    const updates = {};
    allowed.forEach((k) => {
      if (body[k] !== undefined) updates[k] = body[k];
    });
    if (Object.keys(updates).length === 0) {
      return new Response(JSON.stringify({ error: "Nothing to update" }), { status: 400 });
    }
    updates.updated_at = new Date().toISOString();

    const { data: existing } = await admin
      .from("user_settings")
      .select("id")
      .eq("user_id", me.id)
      .maybeSingle();

    if (existing) {
      await admin.from("user_settings").update(updates).eq("id", existing.id);
    } else {
      await admin.from("user_settings").insert({ user_id: me.id, ...updates });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
