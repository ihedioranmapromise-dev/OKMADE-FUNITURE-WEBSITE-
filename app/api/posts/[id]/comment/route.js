import { createSupabaseServer } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/send-email";
import { newCommentEmail, commentReplyEmail } from "@/lib/email-templates";

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
    const { id } = params;
    const body = await request.json();
    const { content, author_name, author_email, parent_id, viewer_id } = body;

    if (!content?.trim()) {
      return new Response(JSON.stringify({ error: "Empty comment" }), { status: 400 });
    }

    const { data: post } = await admin
      .from("posts")
      .select("id, author_id, status, approved")
      .eq("id", id)
      .maybeSingle();
    if (!post) return new Response(JSON.stringify({ error: "Post not found" }), { status: 404 });
    if (post.status !== "published" || post.approved === false) {
      return new Response(JSON.stringify({ error: "Post not available" }), { status: 403 });
    }

    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      null;

    let authorId = null;
    let finalName = author_name;
    let isGuest = true;
    let guestId = null;

    if (user) {
      const { data: me } = await admin
        .from("clients")
        .select("id, display_name, username")
        .eq("auth_id", user.id)
        .single();
      if (me) {
        authorId = me.id;
        finalName = me.display_name || me.username;
        isGuest = false;
      }
    } else if (viewer_id) {
      guestId = String(viewer_id).slice(0, 40);
    }

    if (!finalName?.trim()) {
      return new Response(JSON.stringify({ error: "Name required" }), { status: 400 });
    }

    const { data, error } = await admin
      .from("post_comments")
      .insert([{
        post_id: id,
        parent_id: parent_id || null,
        author_id: authorId,
        author_name: finalName,
        author_email: author_email || null,
        is_guest: isGuest,
        guest_id: guestId,
        ip,
        content: content.trim(),
      }])
      .select()
      .single();

    if (error) throw error;

    if (parent_id) {
      const { data: parent } = await admin
        .from("post_comments")
        .select("author_id, author_name")
        .eq("id", parent_id)
        .maybeSingle();

      if (parent?.author_id && parent.author_id !== authorId) {
        const { data: parentClient } = await admin
          .from("clients")
          .select("email")
          .eq("id", parent.author_id)
          .maybeSingle();

        if (parentClient?.email && (await userWantsEmails(parent.author_id))) {
          const tpl = commentReplyEmail({
            replierName: finalName,
            replierUsername: user?.user_metadata?.username || "guest",
            preview: content.trim().slice(0, 200),
            postId: id,
          });
          await sendEmail({ to: parentClient.email, subject: tpl.subject, html: tpl.html });
        }
      }
    } else if (post.author_id && post.author_id !== authorId) {
      const { data: author } = await admin
        .from("clients")
        .select("email")
        .eq("id", post.author_id)
        .maybeSingle();

      if (author?.email && (await userWantsEmails(post.author_id))) {
        const tpl = newCommentEmail({
          commenterName: finalName,
          commenterUsername: user?.user_metadata?.username || "guest",
          preview: content.trim().slice(0, 200),
          postId: id,
        });
        await sendEmail({ to: author.email, subject: tpl.subject, html: tpl.html });
      }
    }

    if (post.author_id && post.author_id !== authorId) {
      await admin.from("notifications").insert([{
        client_id: post.author_id,
        type: "new_comment",
        message: `${finalName} commented on your post.`,
        target_url: `/client/posts/${id}`,
      }]);
    }

    return new Response(JSON.stringify(data), { status: 201 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
