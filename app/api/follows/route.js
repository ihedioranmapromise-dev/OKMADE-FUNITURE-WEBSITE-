import { createSupabaseServer } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Toggle follow
export async function POST(request) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

    const { target_username } = await request.json();
    const { data: me } = await admin.from("clients").select("id").eq("auth_id", user.id).single();
    const { data: target } = await admin.from("clients").select("id, is_okmade").eq("username", target_username).single();
    if (!me || !target) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
    if (me.id === target.id) return new Response(JSON.stringify({ error: "Cannot follow yourself" }), { status: 400 });

    const { data: existing } = await admin
      .from("follows")
      .select("id")
      .eq("follower_id", me.id)
      .eq("following_id", target.id)
      .single();

    if (existing) {
      await admin.from("follows").delete().eq("id", existing.id);
      return new Response(JSON.stringify({ following: false }), { status: 200 });
    } else {
      await admin.from("follows").insert([{ follower_id: me.id, following_id: target.id }]);
      await admin.from("notifications").insert([{
        client_id: target.id,
        type: "new_follower",
        message: `@${me.id.slice(0, 6)} started following you.`,
        target_url: `/client/dashboard`,
      }]).catch(() => {});
      return new Response(JSON.stringify({ following: true }), { status: 200 });
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

// GET follow counts + list for a username
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");
    const type = searchParams.get("type") || "followers"; // followers | following

    const { data: target } = await admin.from("clients").select("id").eq("username", username).single();
    if (!target) return new Response(JSON.stringify([]), { status: 200 });

    if (type === "followers") {
      const { data } = await admin
        .from("follows")
        .select("follower_id, clients:follower_id (username, display_name, profile_pic, skill)")
        .eq("following_id", target.id);
      return new Response(JSON.stringify(data || []), { status: 200 });
    } else {
      const { data } = await admin
        .from("follows")
        .select("following_id, clients:following_id (username, display_name, profile_pic, skill)")
        .eq("follower_id", target.id);
      return new Response(JSON.stringify(data || []), { status: 200 });
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
