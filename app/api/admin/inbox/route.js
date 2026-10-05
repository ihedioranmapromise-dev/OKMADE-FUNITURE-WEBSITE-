import { createClient } from "@supabase/supabase-js";
import { isAdmin, unauthorized, badRequest, serverError } from "@/lib/admin-guard";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  if (!(await isAdmin(request))) return unauthorized();
  try {
    const [itemsRes, countRes] = await Promise.all([
      admin
        .from("admin_inbox")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100),
      admin
        .from("admin_inbox")
        .select("*", { count: "exact", head: true })
        .eq("is_read", false),
    ]);
    return new Response(
      JSON.stringify({
        items: itemsRes.data || [],
        unread: countRes.count || 0,
      }),
      { status: 200 }
    );
  } catch (err) {
    return serverError(err.message);
  }
}

export async function PUT(request) {
  if (!(await isAdmin(request))) return unauthorized();
  try {
    const { id, mark_all } = await request.json();

    if (mark_all) {
      await admin.from("admin_inbox").update({ is_read: true }).eq("is_read", false);
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    if (!id) return badRequest("id or mark_all required");

    await admin.from("admin_inbox").update({ is_read: true }).eq("id", id);
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
    await admin.from("admin_inbox").delete().eq("id", id);
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return serverError(err.message);
  }
}
