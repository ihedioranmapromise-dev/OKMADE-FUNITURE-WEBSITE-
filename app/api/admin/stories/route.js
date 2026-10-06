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
      .from("client_posts")
      .select(`
        id, image_url, created_at, flagged,
        clients:client_id (id, username, display_name, profile_pic)
      `)
      .order("created_at", { ascending: false })
      .limit(200);
    return new Response(JSON.stringify(data || []), { status: 200 });
  } catch (err) {
    return serverError(err.message);
  }
}

export async function PUT(request) {
  if (!(await isAdmin(request))) return unauthorized();
  try {
    const { id, flagged } = await request.json();
    if (!id || typeof flagged !== "boolean") return badRequest("id and flagged required");
    const { error } = await admin
      .from("client_posts")
      .update({ flagged })
      .eq("id", id);
    if (error) return serverError(error.message);
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
    if (!id) return badRequest("id required");

    const { data: story } = await admin
      .from("client_posts")
      .select("image_url")
      .eq("id", id)
      .maybeSingle();

    if (story?.image_url) {
      const path = story.image_url.split("/public/")[1];
      if (path) await admin.storage.from("story-images").remove([path]);
    }

    await admin.from("story_views").delete().eq("story_id", id);
    await admin.from("story_reactions").delete().eq("story_id", id);
    await admin.from("story_comments").delete().eq("story_id", id);
    await admin.from("client_posts").delete().eq("id", id);

    await logActivity({
      action: "story_deleted",
      target_type: "story",
      target_id: id,
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return serverError(err.message);
  }
}
