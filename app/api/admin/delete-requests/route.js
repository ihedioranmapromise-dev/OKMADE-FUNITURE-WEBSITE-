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
    .from("delete_requests")
    .select("*")
    .order("created_at", { ascending: false });
  return new Response(JSON.stringify(data || []), { status: 200 });
}

export async function PUT(request) {
  if (!(await isAdmin(request))) return unauthorized();
  const { id, status } = await request.json();
  if (!id || !status) return badRequest("id and status required");
  const { error } = await admin
    .from("delete_requests")
    .update({ status })
    .eq("id", id);
  if (error) return serverError(error.message);
  await logActivity({ action: "delete_request_updated", target_type: "delete_request", target_id: id, details: { status } });
  return new Response(JSON.stringify({ success: true }), { status: 200 });
}
