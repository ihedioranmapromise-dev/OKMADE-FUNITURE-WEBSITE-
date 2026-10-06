import { createClient } from "@supabase/supabase-js";
import { isAdmin, unauthorized, badRequest, serverError } from "@/lib/admin-guard";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  if (!(await isAdmin(request))) return unauthorized();
  try {
    const { data } = await admin
      .from("error_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300);
    return new Response(JSON.stringify(data || []), { status: 200 });
  } catch (err) {
    return serverError(err.message);
  }
}

export async function DELETE(request) {
  if (!(await isAdmin(request))) return unauthorized();
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id === "all") {
      await admin.from("error_log").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    if (!id) return badRequest("id required");
    await admin.from("error_log").delete().eq("id", id);
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return serverError(err.message);
  }
}
