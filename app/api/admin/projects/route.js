import { createClient } from "@supabase/supabase-js";
import { isAdmin, unauthorized, badRequest, serverError } from "@/lib/admin-guard";
import { logActivity } from "@/lib/admin-auth";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function generateToken() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

export async function POST(request) {
  if (!(await isAdmin(request))) return unauthorized();
  try {
    const body = await request.json();
    const {
      token_string,
      client_name,
      client_contact,
      client_address,
      work_description,
      city,
      duration_weeks,
      project_details,
      category_id,
      price,
      is_standalone,
      client_id,
      images,
    } = body;

    if (!work_description) return badRequest("Work description required");
    if (!is_standalone && (!client_name || !client_contact)) {
      return badRequest("Client name and contact required for client projects");
    }

    const token = is_standalone ? null : token_string || generateToken();

    const { data: project, error: projErr } = await admin
      .from("projects")
      .insert({
        token_string: token,
        client_name: is_standalone ? null : client_name,
        client_contact: is_standalone ? null : client_contact,
        client_address: is_standalone ? null : client_address || null,
        work_description,
        city: city || null,
        duration_weeks: duration_weeks ? parseInt(duration_weeks) : null,
        project_details: project_details || null,
        category_id: category_id || null,
        price: price ? parseFloat(price) : null,
        status: "active",
        is_standalone: !!is_standalone,
        client_id: !is_standalone && client_id ? client_id : null,
      })
      .select()
      .single();
    if (projErr) return serverError(projErr.message);

    if (Array.isArray(images) && images.length > 0) {
      const rows = images.map((img, i) => ({
        project_id: project.id,
        image_url: img.url,
        display_order: i,
        description: img.description || null,
      }));
      const { error: imgErr } = await admin
        .from("project_request_images")
        .insert(rows);
      if (imgErr) return serverError(imgErr.message);
    }

    if (!is_standalone && client_id) {
      await admin.from("notifications").insert({
        client_id,
        type: "project_generated",
        message: `A new project "${token}" has been assigned to you.`,
        target_url: `/workspace/${token}`,
      });
    }

    await logActivity({
      action: "project_created",
      target_type: "project",
      target_id: project.id,
      details: { work_description, token },
    });

    return new Response(JSON.stringify(project), { status: 200 });
  } catch (err) {
    return serverError(err.message);
  }
}

export async function PUT(request) {
  if (!(await isAdmin(request))) return unauthorized();
  try {
    const { id, status, timeline } = await request.json();
    if (!id) return badRequest("id required");
    const updates = {};
    if (status) updates.status = status;
    if (Array.isArray(timeline)) updates.timeline = timeline;
    if (Object.keys(updates).length === 0) return badRequest("Nothing to update");

    const { error } = await admin.from("projects").update(updates).eq("id", id);
    if (error) return serverError(error.message);

    await logActivity({
      action: "project_updated",
      target_type: "project",
      target_id: id,
      details: updates,
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
    if (!id) return badRequest("id required");

    const [reqImgs, progImgs] = await Promise.all([
      admin.from("project_request_images").select("image_url").eq("project_id", id),
      admin.from("progress_images").select("image_url").eq("project_id", id),
    ]);

    const reqPaths = (reqImgs.data || [])
      .map((i) => i.image_url.split("/public/")[1])
      .filter(Boolean);
    const progPaths = (progImgs.data || [])
      .map((i) => i.image_url.split("/public/")[1])
      .filter(Boolean);

    if (reqPaths.length > 0) {
      await admin.storage.from("workspace-requests").remove(reqPaths);
    }
    if (progPaths.length > 0) {
      await admin.storage.from("workspace-progress").remove(progPaths);
    }

    await admin.from("project_request_images").delete().eq("project_id", id);
    await admin.from("progress_images").delete().eq("project_id", id);
    await admin.from("project_likes").delete().eq("project_id", id);
    await admin.from("story_reactions").delete().eq("story_id", id);
    await admin.from("public_comments").delete().eq("project_id", id);
    const { error } = await admin.from("projects").delete().eq("id", id);
    if (error) return serverError(error.message);

    await logActivity({ action: "project_deleted", target_type: "project", target_id: id });
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return serverError(err.message);
  }
}
