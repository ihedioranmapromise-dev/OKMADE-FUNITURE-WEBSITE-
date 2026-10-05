import { createClient } from "@supabase/supabase-js";
import { isAdmin, unauthorized, badRequest, serverError } from "@/lib/admin-guard";
import { logActivity } from "@/lib/admin-auth";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  if (!(await isAdmin(request))) return unauthorized();
  const { data } = await admin
    .from("clients")
    .select(
      "id, username, display_name, first_name, last_name, profile_pic, email, phone_number, skill, is_okmade, verified, suspended, created_at"
    )
    .order("created_at", { ascending: false });
  return new Response(JSON.stringify(data || []), { status: 200 });
}

export async function PUT(request) {
  if (!(await isAdmin(request))) return unauthorized();
  const body = await request.json();
  const { id, ids, verified, suspended, action } = body;

  // Bulk mode
  if (Array.isArray(ids) && ids.length > 0) {
    if (action === "verify") {
      await admin.from("clients").update({ verified: true }).in("id", ids);
    } else if (action === "unverify") {
      await admin.from("clients").update({ verified: false }).in("id", ids);
    } else if (action === "suspend") {
      await admin.from("clients").update({ suspended: true }).in("id", ids);
    } else if (action === "unsuspend") {
      await admin.from("clients").update({ suspended: false }).in("id", ids);
    } else {
      return badRequest("Unknown bulk action");
    }
    await logActivity({
      action: `bulk_user_${action}`,
      target_type: "user",
      details: { count: ids.length },
    });
    return new Response(JSON.stringify({ success: true, count: ids.length }), {
      status: 200,
    });
  }

  // Single mode
  if (!id) return badRequest("id or ids required");
  const updates = {};
  if (typeof verified === "boolean") updates.verified = verified;
  if (typeof suspended === "boolean") updates.suspended = suspended;
  if (Object.keys(updates).length === 0) return badRequest("Nothing to update");

  const { error } = await admin.from("clients").update(updates).eq("id", id);
  if (error) return serverError(error.message);

  await logActivity({
    action: "user_updated",
    target_type: "user",
    target_id: id,
    details: updates,
  });
  return new Response(JSON.stringify({ success: true }), { status: 200 });
}
