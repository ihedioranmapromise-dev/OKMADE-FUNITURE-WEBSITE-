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
    const { data } = await admin
      .from("posts")
      .select(`
        id, author_id, content, image_urls, created_at, requires_approval, approved,
        clients:author_id (id, username, display_name, profile_pic)
      `)
      .eq("requires_approval", true)
      .eq("approved", false)
      .order("created_at", { ascending: false });
    return new Response(JSON.stringify(data || []), { status: 200 });
  } catch (err) {
    return serverError(err.message);
  }
}

export async function PUT(request) {
  if (!(await isAdmin(request))) return unauthorized();
  try {
    const { id, action } = await request.json();
    if (!id || !["approve", "reject"].includes(action)) {
      return badRequest("id and action required");
    }

    if (action === "approve") {
      const { error } = await admin
        .from("posts")
        .update({ approved: true })
        .eq("id", id);
      if (error) return serverError(error.message);
      await logActivity({ action: "post_approved", target_type: "post", target_id: id });
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    // reject
    await admin.from("post_reactions").delete().eq("post_id", id);
    await admin.from("post_comments").delete().eq("post_id", id);
    await admin.from("posts").delete().eq("id", id);
    await logActivity({ action: "post_rejected", target_type: "post", target_id: id });
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return serverError(err.message);
  }
}
