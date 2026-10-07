import { createSupabaseServer } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify([]), { status: 200 });

    const { data: me } = await admin
      .from("clients")
      .select("id")
      .eq("auth_id", user.id)
      .maybeSingle();
    if (!me) return new Response(JSON.stringify([]), { status: 200 });

    const { searchParams } = new URL(request.url);
    const threadId = searchParams.get("thread_id");
    const q = (searchParams.get("q") || "").trim();
    if (!threadId || q.length < 2) return new Response(JSON.stringify([]), { status: 200 });

    const { data: thread } = await admin
      .from("message_threads")
      .select("user_a, user_b")
      .eq("id", threadId)
      .maybeSingle();
    if (!thread) return new Response(JSON.stringify([]), { status: 200 });
    if (thread.user_a !== me.id && thread.user_b !== me.id) {
      return new Response(JSON.stringify([]), { status: 200 });
    }

    const { data } = await admin
      .from("messages")
      .select("id, content, sender_id, created_at")
      .eq("thread_id", threadId)
      .ilike("content", `%${q}%`)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(50);

    return new Response(JSON.stringify(data || []), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
