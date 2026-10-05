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
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let query = admin
      .from("posts")
      .select("*, clients:author_id (username, display_name, profile_pic)")
      .order("created_at", { ascending: false })
      .limit(200);

    if (status) query = query.eq("status", status);

    const { data } = await query;
    return new Response(JSON.stringify(data || []), { status: 200 });
  } catch (err) {
    return serverError(err.message);
  }
}

export async function POST(request) {
  if (!(await isAdmin(request))) return unauthorized();
  try {
    const { content, image_urls, font_family, status, scheduled_for, author_id } =
      await request.json();

    if (!content?.trim()) return badRequest("Content required");

    const { data: okmade } = await admin
      .from("clients")
      .select("id")
      .eq("is_okmade", true)
      .maybeSingle();

    const useAuthorId = author_id || okmade?.id;
    if (!useAuthorId) return badRequest("No author");

    const payload = {
      author_id: useAuthorId,
      content: content.trim(),
      image_urls: Array.isArray(image_urls) ? image_urls : [],
      font_family: font_family || "sans-serif",
      is_auto: false,
      status: status || "published",
    };

    if (status === "scheduled" && scheduled_for) {
      payload.scheduled_for = new Date(scheduled_for).toISOString();
    }

    const { data, error } = await admin
      .from("posts")
      .insert(payload)
      .select()
      .single();

    if (error) return serverError(error.message);

    await logActivity({
      action: status === "scheduled" ? "post_scheduled" : "post_created",
      target_type: "post",
      target_id: data.id,
      details: { status },
    });

    return new Response(JSON.stringify(data), { status: 200 });
  } catch (err) {
    return serverError(err.message);
  }
}

export async function PUT(request) {
  if (!(await isAdmin(request))) return unauthorized();
  try {
    const { id, content, status, scheduled_for } = await request.json();
    if (!id) return badRequest("id required");

    const updates = { updated_at: new Date().toISOString() };
    if (content !== undefined) updates.content = content;
    if (status) updates.status = status;
    if (scheduled_for !== undefined) {
      updates.scheduled_for = scheduled_for ? new Date(scheduled_for).toISOString() : null;
    }

    const { error } = await admin.from("posts").update(updates).eq("id", id);
    if (error) return serverError(error.message);

    await logActivity({
      action: "post_updated",
      target_type: "post",
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

    await Promise.all([
      admin.from("post_reactions").delete().eq("post_id", id),
      admin.from("post_comments").delete().eq("post_id", id),
      admin.from("post_reports").delete().eq("post_id", id),
    ]);
    await admin.from("posts").delete().eq("id", id);

    await logActivity({
      action: "post_deleted",
      target_type: "post",
      target_id: id,
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return serverError(err.message);
  }
}
