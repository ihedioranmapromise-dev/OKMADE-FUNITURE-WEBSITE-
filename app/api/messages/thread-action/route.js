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

    const { thread_id, action } = await request.json();
    if (!thread_id || !["pin", "unpin", "archive", "unarchive"].includes(action)) {
      return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400 });
    }

    const { data: thread } = await admin
      .from("message_threads")
      .select("id, user_a, user_b, pinned_by, archived_by")
      .eq("id", thread_id)
      .maybeSingle();
    if (!thread) return new Response(JSON.stringify({ error: "Thread not found" }), { status: 404 });
    if (thread.user_a !== me.id && thread.user_b !== me.id) {
      return new Response(JSON.stringify({ error: "Not your thread" }), { status: 403 });
    }

    const pinnedList = new Set(thread.pinned_by || []);
    const archivedList = new Set(thread.archived_by || []);

    if (action === "pin") pinnedList.add(me.id);
    else if (action === "unpin") pinnedList.delete(me.id);
    else if (action === "archive") archivedList.add(me.id);
    else if (action === "unarchive") archivedList.delete(me.id);

    const { error } = await admin
      .from("message_threads")
      .update({
        pinned_by: Array.from(pinnedList),
        archived_by: Array.from(archivedList),
      })
      .eq("id", thread_id);

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

    return new Response(
      JSON.stringify({
        success: true,
        pinned: pinnedList.has(me.id),
        archived: archivedList.has(me.id),
      }),
      { status: 200 }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
