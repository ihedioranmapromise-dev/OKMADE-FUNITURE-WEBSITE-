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
    .single();
  return data?.email_notifications ?? true;
}

export async function POST(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { content, author_name, author_email, parent_id } = body;

    if (!content?.trim()) {
      return new Response(JSON.stringify({ error: "Empty comment" }), { status: 400 });
    }

    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    let authorId = null;
    let finalName = author_name;
    let isGuest = true;

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
        content: content.trim(),
      }])
      .select()
      .single();

    if (error) throw error;

    // Fetch the post to know its author
    const { data: post } = await admin
      .from("posts")
      .select("author_id, clients:author_id (email, username, display_name)")
      .eq("id", id)
      .single();

    // Send emails
    if (post) {
      // If this is a reply to another comment
      if (parent_id) {
        const { data: parent } = await admin
          .from("post_comments")
          .select("author_id, author_name, clients:author_id (email)")
          .eq("id", parent_id)
          .single();

        if (parent?.author_id && parent.author_id !== authorId && parent.clients?.email) {
          if (await userWantsEmails(parent.author_id)) {
            const tpl = commentReplyEmail({
              replierName: finalName,
              replierUsername: user?.user_metadata?.username || "guest",
              preview: content.trim().slice(0, 200),
              postId: id,
            });
            await sendEmail({ to: parent.clients.email, subject: tpl.subject, html: tpl.html });
          }
        }
      } else {
        // Top-level comment → notify post author
        if (post.author_id && post.author_id !== authorId && post.clients?.email) {
          if (await userWantsEmails(post.author_id)) {
            const tpl = newCommentEmail({
              commenterName: finalName,
              commenterUsername: user?.user_metadata?.username || "guest",
              preview: content.trim().slice(0, 200),
              postId: id,
            });
            await sendEmail({ to: post.clients.email, subject: tpl.subject, html: tpl.html });
          }
        }
      }

      // In-app notification
      if (post.author_id && post.author_id !== authorId) {
        await admin.from("notifications").insert([{
          client_id: post.author_id,
          type: "new_comment",
          message: `${finalName} commented on your post.`,
          target_url: `/client/posts/${id}`,
        }]);
      }
    }

    return new Response(JSON.stringify(data), { status: 201 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
