import { createSupabaseServer } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/send-email";
import { postReactionEmail } from "@/lib/email-templates";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function userWantsEmails(clientId) {
  const { data } = await admin
    .from("user_settings")
    .select("email_notifications")
    .eq("user_id", clientId)
    .single();
  return data?.email_notifications ?? true;
}

export async function POST(request, { params }) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    const { id } = params;
    const { reaction_type } = await request.json();

    if (!["like", "love", "haha", "wow", "sad", "angry"].includes(reaction_type)) {
      return new Response(JSON.stringify({ error: "Invalid reaction" }), { status: 400 });
    }

    const userId = user ? user.id : (request.headers.get("x-guest-id") || "guest");

    const { data: existing } = await admin
      .from("post_reactions")
      .select("id, reaction_type")
      .eq("post_id", id)
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      if (existing.reaction_type === reaction_type) {
        await admin.from("post_reactions").delete().eq("id", existing.id);
        return new Response(JSON.stringify({ action: "removed" }), { status: 200 });
      } else {
        await admin.from("post_reactions").update({ reaction_type }).eq("id", existing.id);
        return new Response(JSON.stringify({ action: "updated" }), { status: 200 });
      }
    }

    await admin.from("post_reactions").insert([{
      post_id: id,
      user_id: userId,
      reaction_type,
    }]);

    // Only send email to post author (skip if self)
    if (user) {
      const { data: me } = await admin
        .from("clients")
        .select("id, display_name, username")
        .eq("auth_id", user.id)
        .single();

      const { data: post } = await admin
        .from("posts")
        .select("author_id, clients:author_id (email)")
        .eq("id", id)
        .single();

      if (post && post.author_id !== me?.id && post.clients?.email) {
        if (await userWantsEmails(post.author_id)) {
          const tpl = postReactionEmail({
            reactorName: me?.display_name || me?.username || "Someone",
            reactionType: reaction_type,
            postId: id,
          });
          await sendEmail({ to: post.clients.email, subject: tpl.subject, html: tpl.html });
        }
      }
    }

    return new Response(JSON.stringify({ action: "added" }), { status: 201 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
