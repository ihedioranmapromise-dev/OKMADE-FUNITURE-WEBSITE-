import { createClient } from "@supabase/supabase-js";
import { isAdmin, unauthorized, badRequest, serverError } from "@/lib/admin-guard";
import { logActivity } from "@/lib/admin-auth";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  if (!(await isAdmin(request))) return unauthorized();
  const { data } = await admin.from("categories").select("*").order("name");
  return new Response(JSON.stringify(data || []), { status: 200 });
}

export async function POST(request) {
  if (!(await isAdmin(request))) return unauthorized();
  const { name } = await request.json();
  if (!name) return badRequest("Name required");
  const { data, error } = await admin
    .from("categories")
    .insert({ name })
    .select()
    .single();
  if (error) return serverError(error.message);
  await logActivity({ action: "category_created", target_type: "category", target_id: data.id, details: { name } });
  return new Response(JSON.stringify(data), { status: 200 });
}

export async function PUT(request) {
  if (!(await isAdmin(request))) return unauthorized();
  const { id, name } = await request.json();
  if (!id || !name) return badRequest("Missing fields");
  const { error } = await admin.from("categories").update({ name }).eq("id", id);
  if (error) return serverError(error.message);
  await logActivity({ action: "category_updated", target_type: "category", target_id: id, details: { name } });
  return new Response(JSON.stringify({ success: true }), { status: 200 });
}

export async function DELETE(request) {
  if (!(await isAdmin(request))) return unauthorized();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return badRequest("id required");
  const { error } = await admin.from("categories").delete().eq("id", id);
  if (error) return serverError(error.message);
  await logActivity({ action: "category_deleted", target_type: "category", target_id: id });
  return new Response(JSON.stringify({ success: true }), { status: 200 });
}
