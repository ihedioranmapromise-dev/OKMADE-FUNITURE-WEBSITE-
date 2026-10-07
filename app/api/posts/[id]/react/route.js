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
    .maybeSingle();
  return data?.email_notifications ?? true;
}

export async function POST(request, { params }) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    const { id } = params;
    const body = await request.json();
    const { reaction_type, viewer_id } = body;

    if (!["like", "love", "haha", "wow", "sad", "angry"].includes(reaction_type)) {
      return new Response(JSON.stringify({ error: "Invalid reaction" }), { status: 400 });
    }

    const { data: post } = await admin
      .from("posts")
      .select("author_id, status, approved")
      .eq("id", id)
      .maybeSingle();
    if (!post) return new Response(JSON.stringify({ error: "Post not found" }), { status: 404 });
    if (post.status !== "published" || post.approved === false) {
      return new Response(JSON.stringify({ error: "Post not available" }), { status: 403 });
    }

    let userId;
    if (user) {
      const { data: me } = await admin
        .from("clients")
        .select("id")
        .eq("auth_id", user.id)
        .maybeSingle();
      if (!me) return new Response(JSON.stringify({ error: "Profile not found" }), { status: 404 });
      userId = me.id;
    } else {
      userId = viewer_id ? `guest:${String(viewer_id).slice(0, 40)}` : "guest:anonymous";
    }

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

    if (user && post.author_id) {
      const { data: me } = await admin
        .from("clients")
        .select("id, display_name, username")
        .eq("auth_id", user.id)
        .single();

      if (post.author_id !== me?.id) {
        const { data: author } = await admin
          .from("clients")
          .select("email")
          .eq("id", post.author_id)
          .maybeSingle();

        if (author?.email && (await userWantsEmails(post.author_id))) {
          const tpl = postReactionEmail({
            reactorName: me?.display_name || me?.username || "Someone",
            reactionType: reaction_type,
            postId: id,
          });
          await sendEmail({ to: author.email, subject: tpl.subject, html: tpl.html });
        }
      }
    }

    return new Response(JSON.stringify({ action: "added" }), { status: 201 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
