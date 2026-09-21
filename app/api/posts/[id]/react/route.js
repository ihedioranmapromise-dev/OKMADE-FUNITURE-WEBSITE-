import { createSupabaseServer } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request, { params }) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    const { id } = params;
    const { reaction_type } = await request.json();

    if (!["like", "love", "haha", "wow", "sad", "angry"].includes(reaction_type)) {
      return new Response(JSON.stringify({ error: "Invalid reaction" }), { status: 400 });
    }

    // User identifier (auth user id, or guest id)
    const { guestId } = await request.json().catch(() => ({}));
    const userId = user ? user.id : (request.headers.get("x-guest-id") || "guest");

    // Check existing
    const { data: existing } = await admin
      .from("post_reactions")
      .select("id, reaction_type")
      .eq("post_id", id)
      .eq("user_id", userId)
      .single();

    if (existing) {
      if (existing.reaction_type === reaction_type) {
        // Same reaction → remove (toggle off)
        await admin.from("post_reactions").delete().eq("id", existing.id);
        return new Response(JSON.stringify({ action: "removed" }), { status: 200 });
      } else {
        // Different reaction → update
        await admin.from("post_reactions").update({ reaction_type }).eq("id", existing.id);
        return new Response(JSON.stringify({ action: "updated" }), { status: 200 });
      }
    } else {
      await admin.from("post_reactions").insert([{
        post_id: id,
        user_id: userId,
        reaction_type,
      }]);
      return new Response(JSON.stringify({ action: "added" }), { status: 201 });
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
