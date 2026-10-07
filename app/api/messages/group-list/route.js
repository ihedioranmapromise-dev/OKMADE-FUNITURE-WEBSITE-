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
    if (!user) return new Response(JSON.stringify({ members: [] }), { status: 200 });

    const { data: me } = await admin
      .from("clients")
      .select("id")
      .eq("auth_id", user.id)
      .maybeSingle();
    if (!me) return new Response(JSON.stringify({ members: [] }), { status: 200 });

    const { searchParams } = new URL(request.url);
    const threadId = searchParams.get("thread_id");
    if (!threadId) return new Response(JSON.stringify({ members: [] }), { status: 200 });

    // Must be a member
    const { data: myMembership } = await admin
      .from("thread_members")
      .select("id")
      .eq("thread_id", threadId)
      .eq("client_id", me.id)
      .maybeSingle();
    if (!myMembership) return new Response(JSON.stringify({ members: [] }), { status: 200 });

    const { data: members } = await admin
      .from("thread_members")
      .select("client_id, clients:client_id (username, display_name, profile_pic)")
      .eq("thread_id", threadId);

    const cleaned = (members || []).map((m) => ({
      username: m.clients?.username,
      display_name: m.clients?.display_name,
      profile_pic: m.clients?.profile_pic,
    }));

    return new Response(JSON.stringify({ members: cleaned }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ members: [], error: err.message }), { status: 200 });
  }
}
