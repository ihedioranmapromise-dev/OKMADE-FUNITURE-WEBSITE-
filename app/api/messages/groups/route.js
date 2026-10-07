import { createSupabaseServer } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

    const { data: me } = await admin
      .from("clients")
      .select("id")
      .eq("auth_id", user.id)
      .single();
    if (!me) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });

    const { name, usernames } = await request.json();
    if (!name?.trim() || !Array.isArray(usernames) || usernames.length < 1) {
      return new Response(JSON.stringify({ error: "Name and at least 1 member required" }), { status: 400 });
    }
    if (usernames.length > 30) {
      return new Response(JSON.stringify({ error: "Max 30 members" }), { status: 400 });
    }

    const { data: members } = await admin
      .from("clients")
      .select("id, username")
      .in("username", usernames);
    if (!members || members.length === 0) {
      return new Response(JSON.stringify({ error: "No valid members found" }), { status: 400 });
    }

    // Verify all are friends of me
    const validIds = [];
    for (const m of members) {
      if (m.id === me.id) continue;
      const [a, b] = [me.id, m.id].sort();
      const { data: friend } = await admin
        .from("friends")
        .select("id")
        .eq("user_a", a)
        .eq("user_b", b)
        .maybeSingle();
      if (friend) validIds.push(m.id);
    }

    if (validIds.length === 0) {
      return new Response(JSON.stringify({ error: "No valid friends found" }), { status: 400 });
    }

    const { data: thread } = await admin
      .from("message_threads")
      .insert([{
        user_a: me.id,
        user_b: null,
        is_group: true,
        group_name: name.trim(),
      }])
      .select("id")
      .single();

    const memberRows = [me.id, ...validIds].map((cid) => ({
      thread_id: thread.id,
      client_id: cid,
    }));

    await admin.from("thread_members").insert(memberRows);

    return new Response(JSON.stringify({ thread_id: thread.id }), { status: 201 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
