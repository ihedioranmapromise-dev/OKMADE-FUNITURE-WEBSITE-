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
    .from("showroom")
    .select("id, description, price, featured")
    .eq("featured", true)
    .order("created_at", { ascending: false });
  return new Response(JSON.stringify(data || []), { status: 200 });
}

export async function PUT(request) {
  if (!(await isAdmin(request))) return unauthorized();
  const { product_id, featured } = await request.json();
  if (!product_id || typeof featured !== "boolean") return badRequest("product_id and featured required");
  const { error } = await admin
    .from("showroom")
    .update({ featured })
    .eq("id", product_id);
  if (error) return serverError(error.message);
  await logActivity({ action: "featured_toggled", target_type: "product", target_id: product_id, details: { featured } });
  return new Response(JSON.stringify({ success: true }), { status: 200 });
}
