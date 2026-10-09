import { createSupabaseServer } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request, { params }) {
  try {
    const { commentId } = params;
    const body = await request.json();
    const { reason, details } = body;

    if (!reason?.trim()) {
      return new Response(JSON.stringify({ error: "Reason required" }), { status: 400 });
    }

    const { data: comment } = await admin
      .from("post_comments")
      .select("id, post_id")
      .eq("id", commentId)
      .maybeSingle();
    if (!comment) {
      return new Response(JSON.stringify({ error: "Comment not found" }), { status: 404 });
    }

    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    let reporterId = null;
    if (user) {
      const { data: me } = await admin
        .from("clients")
        .select("id")
        .eq("auth_id", user.id)
        .maybeSingle();
      reporterId = me?.id || null;
    }

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      null;

    const { data, error } = await admin
      .from("post_reports")
      .insert({
        post_id: comment.post_id,
        comment_id: commentId,
        reporter_id: reporterId,
        reporter_ip: ip,
        reason: reason.trim(),
        details: details?.trim() || null,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    await admin.from("admin_inbox").insert({
      type: "comment_report",
      title: `Comment reported`,
      body: reason.trim().slice(0, 200),
      link: `/admin/dashboard?tab=reports`,
    });

    return new Response(JSON.stringify({ success: true, id: data.id }), { status: 201 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
