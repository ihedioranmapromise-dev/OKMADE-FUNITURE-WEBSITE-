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
    .select("id, username")
    .eq("auth_id", user.id)
    .maybeSingle();
  return client;
}

export async function GET(request) {
  try {
    const me = await getMe();
    if (!me) return new Response(JSON.stringify([]), { status: 200 });

    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim();
    if (q.length < 2) return new Response(JSON.stringify([]), { status: 200 });

    // Get threads I belong to
    const { data: myThreads } = await admin
      .from("message_threads")
      .select("id, user_a, user_b")
      .or(`user_a.eq.${me.id},user_b.eq.${me.id}`);
    if (!myThreads || myThreads.length === 0) {
      return new Response(JSON.stringify([]), { status: 200 });
    }

    const threadIds = myThreads.map((t) => t.id);

    // Find messages matching the query in those threads
    const { data: messages } = await admin
      .from("messages")
      .select("id, thread_id, sender_id, content, created_at")
      .in("thread_id", threadIds)
      .ilike("content", `%${q}%`)
      .order("created_at", { ascending: false })
      .limit(50);

    if (!messages || messages.length === 0) {
      return new Response(JSON.stringify([]), { status: 200 });
    }

    // Get other user info for each thread
    const otherIds = new Set();
    myThreads.forEach((t) => {
      const other = t.user_a === me.id ? t.user_b : t.user_a;
      otherIds.add(other);
    });

    const { data: otherClients } = await admin
      .from("clients")
      .select("id, username, display_name, profile_pic")
      .in("id", Array.from(otherIds));

    const clientsById = {};
    (otherClients || []).forEach((c) => {
      clientsById[c.id] = c;
    });

    const threadOtherMap = {};
    myThreads.forEach((t) => {
      const other = t.user_a === me.id ? t.user_b : t.user_a;
      threadOtherMap[t.id] = other;
    });

    const results = messages.map((m) => ({
      ...m,
      other: clientsById[threadOtherMap[m.thread_id]] || null,
    }));

    return new Response(JSON.stringify(results), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
