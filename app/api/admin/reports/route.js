import { createClient } from "@supabase/supabase-js";
import { isAdmin, unauthorized, badRequest, serverError } from "@/lib/admin-guard";
import { logActivity } from "@/lib/admin-auth";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  if (!(await isAdmin(request))) return unauthorized();
  try {
    const [postReportsRes, commentReportsRes] = await Promise.all([
      admin
        .from("post_reports")
        .select(`
          id, post_id, comment_id, reason, details, status, reporter_id, created_at,
          reporter:reporter_id (username, display_name),
          post:post_id (id, content, author_id, image_urls),
          comment:comment_id (id, content, author_name)
        `)
        .order("created_at", { ascending: false })
        .limit(200),
      admin
        .from("comment_reports")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200),
    ]);

    return new Response(
      JSON.stringify({
        post_reports: postReportsRes.data || [],
        comment_reports: commentReportsRes.data || [],
      }),
      { status: 200 }
    );
  } catch (err) {
    return serverError(err.message);
  }
}

export async function PUT(request) {
  if (!(await isAdmin(request))) return unauthorized();
  try {
    const { type, id, status } = await request.json();
    if (!type || !id || !status) return badRequest("Missing fields");
    const table = type === "post" ? "post_reports" : "comment_reports";
    const { error } = await admin.from(table).update({ status }).eq("id", id);
    if (error) return serverError(error.message);
    await logActivity({
      action: "report_status_updated",
      target_type: table,
      target_id: id,
      details: { status },
    });
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return serverError(err.message);
  }
}

export async function DELETE(request) {
  if (!(await isAdmin(request))) return unauthorized();
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const type = searchParams.get("type");
    if (!id || !type) return badRequest("id and type required");

    if (type === "post") {
      const { data: report } = await admin
        .from("post_reports")
        .select("post_id, comment_id")
        .eq("id", id)
        .maybeSingle();

      if (report?.post_id) {
        await admin.from("post_reactions").delete().eq("post_id", report.post_id);
        await admin.from("post_comments").delete().eq("post_id", report.post_id);
        await admin.from("post_reports").delete().eq("post_id", report.post_id);
        await admin.from("posts").delete().eq("id", report.post_id);
      } else if (report?.comment_id) {
        await admin.from("post_comments").delete().eq("id", report.comment_id);
        await admin.from("post_reports").delete().eq("comment_id", report.comment_id);
      }
    } else {
      const { data: report } = await admin
        .from("comment_reports")
        .select("comment_id, comment_type")
        .eq("id", id)
        .maybeSingle();
      if (report?.comment_id) {
        if (report.comment_type === "post_comment") {
          await admin.from("post_comments").delete().eq("id", report.comment_id);
        } else if (report.comment_type === "public_comment") {
          await admin.from("public_comments").delete().eq("id", report.comment_id);
        }
      }
      await admin.from("comment_reports").delete().eq("id", id);
    }

    await logActivity({
      action: "report_deleted_with_content",
      target_type: "report",
      target_id: id,
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return serverError(err.message);
  }
}
