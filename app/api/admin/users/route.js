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
    .select("id, username, display_name, first_name, last_name, profile_pic, email, phone_number, skill, is_okmade, verified, suspended, created_at")
    .order("created_at", { ascending: false });
  return new Response(JSON.stringify(data || []), { status: 200 });
}

export async function PUT(request) {
  if (!(await isAdmin(request))) return unauthorized();
  const { id, verified, suspended } = await request.json();
  if (!id) return badRequest("id required");
  const updates = {};
  if (typeof verified === "boolean") updates.verified = verified;
  if (typeof suspended === "boolean") updates.suspended = suspended;
  if (Object.keys(updates).length === 0) return badRequest("Nothing to update");
  const { error } = await admin.from("clients").update(updates).eq("id", id);
  if (error) return serverError(error.message);
  await logActivity({ action: "user_updated", target_type: "user", target_id: id, details: updates });
  return new Response(JSON.stringify({ success: true }), { status: 200 });
}
