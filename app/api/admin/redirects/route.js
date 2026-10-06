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
      .from("redirects")
      .select("*")
      .order("created_at", { ascending: false });
    return new Response(JSON.stringify(data || []), { status: 200 });
  } catch (err) {
    return serverError(err.message);
  }
}

export async function POST(request) {
  if (!(await isAdmin(request))) return unauthorized();
  try {
    const { from_path, to_path, permanent } = await request.json();
    if (!from_path || !to_path) return badRequest("from_path and to_path required");

    let from = from_path.trim();
    let to = to_path.trim();
    if (!from.startsWith("/")) from = "/" + from;
    if (!to.startsWith("/") && !to.startsWith("http")) to = "/" + to;

    const { data, error } = await admin
      .from("redirects")
      .insert({
        from_path: from,
        to_path: to,
        permanent: !!permanent,
        active: true,
      })
      .select()
      .single();

    if (error) {
      if (error.message.includes("duplicate"))
        return badRequest("A redirect from this path already exists");
      return serverError(error.message);
    }

    await logActivity({
      action: "redirect_created",
      target_type: "redirect",
      target_id: data.id,
      details: { from, to },
    });

    return new Response(JSON.stringify(data), { status: 200 });
  } catch (err) {
    return serverError(err.message);
  }
}

export async function PUT(request) {
  if (!(await isAdmin(request))) return unauthorized();
  try {
    const { id, ...updates } = await request.json();
    if (!id) return badRequest("id required");
    const clean = {};
    if (typeof updates.active === "boolean") clean.active = updates.active;
    if (typeof updates.permanent === "boolean") clean.permanent = updates.permanent;
    if (updates.to_path) clean.to_path = updates.to_path;
    if (Object.keys(clean).length === 0) return badRequest("Nothing to update");

    const { error } = await admin.from("redirects").update(clean).eq("id", id);
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
    await admin.from("redirects").delete().eq("id", id);
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return serverError(err.message);
  }
}
