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
    .from("blocked_ips")
    .select("*")
    .order("created_at", { ascending: false });
  return new Response(JSON.stringify(data || []), { status: 200 });
}

export async function POST(request) {
  if (!(await isAdmin(request))) return unauthorized();
  const { ip, reason } = await request.json();
  if (!ip) return badRequest("ip required");
  const { data, error } = await admin
    .from("blocked_ips")
    .insert({ ip, reason: reason || null })
    .select()
    .single();
  if (error) return serverError(error.message);
  await logActivity({ action: "ip_blocked", target_type: "ip", details: { ip, reason } });
  return new Response(JSON.stringify(data), { status: 200 });
}

export async function DELETE(request) {
  if (!(await isAdmin(request))) return unauthorized();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return badRequest("id required");
  const { error } = await admin.from("blocked_ips").delete().eq("id", id);
  if (error) return serverError(error.message);
  await logActivity({ action: "ip_unblocked", target_type: "ip", target_id: id });
  return new Response(JSON.stringify({ success: true }), { status: 200 });
}
