import { createSupabaseServer } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET() {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ count: 0 }), { status: 200 });

    const { data: me } = await admin
      .from("clients")
      .select("id")
      .eq("auth_id", user.id)
      .maybeSingle();
    if (!me) return new Response(JSON.stringify({ count: 0 }), { status: 200 });

    const { count } = await admin
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("receiver_id", me.id)
      .is("read_at", null)
      .is("deleted_at", null);

    return new Response(JSON.stringify({ count: count || 0 }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ count: 0, error: err.message }), { status: 200 });
  }
}
