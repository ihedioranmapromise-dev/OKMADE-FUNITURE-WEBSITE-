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

export async function POST(request) {
  try {
    const me = await getMe();
    if (!me) return new Response(JSON.stringify({ error: "Not logged in" }), { status: 401 });

    const { endpoint, keys } = await request.json();
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return new Response(JSON.stringify({ error: "Missing subscription data" }), { status: 400 });
    }

    const ua = (request.headers.get("user-agent") || "").slice(0, 300);

    await admin
      .from("push_subscriptions")
      .upsert(
        {
          client_id: me.id,
          endpoint,
          p256dh: keys.p256dh,
          auth: keys.auth,
          user_agent: ua,
        },
        { onConflict: "endpoint" }
      );

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const me = await getMe();
    if (!me) return new Response(JSON.stringify({ error: "Not logged in" }), { status: 401 });
    const { endpoint } = await request.json();
    if (endpoint) {
      await admin
        .from("push_subscriptions")
        .delete()
        .eq("client_id", me.id)
        .eq("endpoint", endpoint);
    }
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
