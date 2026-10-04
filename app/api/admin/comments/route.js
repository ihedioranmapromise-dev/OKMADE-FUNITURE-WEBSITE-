import { createClient } from "@supabase/supabase-js";
import { isAdmin, unauthorized, badRequest, serverError } from "@/lib/admin-guard";
import { logActivity } from "@/lib/admin-auth";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  if (!(await isAdmin(request))) return unauthorized();

  const [postComments, publicComments] = await Promise.all([
    admin
      .from("post_comments")
      .select("*, posts(id, content, author_id)")
      .order("created_at", { ascending: false })
      .limit(200),
    admin
      .from("public_comments")
      .select("*, projects(id, work_description)")
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  return new Response(
    JSON.stringify({
      post_comments: postComments.data || [],
      public_comments: publicComments.data || [],
    }),
    { status: 200 }
  );
}

export async function DELETE(request) {
  if (!(await isAdmin(request))) return unauthorized();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const type = searchParams.get("type"); // "post" or "public"
  if (!id || !type) return badRequest("id and type required");

  const table = type === "post" ? "post_comments" : "public_comments";
  const { error } = await admin.from(table).delete().eq("id", id);
  if (error) return serverError(error.message);
  await logActivity({ action: "comment_deleted", target_type: table, target_id: id });
  return new Response(JSON.stringify({ success: true }), { status: 200 });
}
