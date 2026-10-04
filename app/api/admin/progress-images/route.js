import { createClient } from "@supabase/supabase-js";
import { isAdmin, unauthorized, badRequest, serverError } from "@/lib/admin-guard";
import { logActivity } from "@/lib/admin-auth";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  if (!(await isAdmin(request))) return unauthorized();
  try {
    const { project_id, images, explanation } = await request.json();
    if (!project_id || !Array.isArray(images)) return badRequest("Missing fields");

    const rows = images.map((img, i) => ({
      project_id,
      image_url: img.url,
      description: img.description || null,
      explanation: explanation || null,
      uploaded_by: null,
    }));

    const { error } = await admin.from("progress_images").insert(rows);
    if (error) return serverError(error.message);

    await logActivity({
      action: "progress_uploaded",
      target_type: "project",
      target_id: project_id,
      details: { count: rows.length },
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return serverError(err.message);
  }
}

export async function PUT(request) {
  if (!(await isAdmin(request))) return unauthorized();
  try {
    const { id, explanation, description } = await request.json();
    if (!id) return badRequest("id required");
    const updates = {};
    if (explanation !== undefined) updates.explanation = explanation;
    if (description !== undefined) updates.description = description;
    if (Object.keys(updates).length === 0) return badRequest("Nothing to update");

    const { error } = await admin.from("progress_images").update(updates).eq("id", id);
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

    const { data: img } = await admin
      .from("progress_images")
      .select("image_url")
      .eq("id", id)
      .maybeSingle();

    if (img?.image_url) {
      const path = img.image_url.split("/public/")[1];
      if (path) await admin.storage.from("workspace-progress").remove([path]);
    }

    await admin.from("progress_images").delete().eq("id", id);
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return serverError(err.message);
  }
}
