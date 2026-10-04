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
    .from("ratings")
    .select("*, showroom(id, description)")
    .order("created_at", { ascending: false });
  return new Response(JSON.stringify(data || []), { status: 200 });
}

export async function DELETE(request) {
  if (!(await isAdmin(request))) return unauthorized();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return badRequest("id required");
  const { error } = await admin.from("ratings").delete().eq("id", id);
  if (error) return serverError(error.message);
  await logActivity({ action: "review_deleted", target_type: "review", target_id: id });
  return new Response(JSON.stringify({ success: true }), { status: 200 });
}
