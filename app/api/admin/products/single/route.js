import { createClient } from "@supabase/supabase-js";
import { isAdmin, unauthorized, badRequest, serverError } from "@/lib/admin-guard";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  if (!(await isAdmin(request))) return unauthorized();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return badRequest("id required");
  try {
    const [prodRes, imgRes] = await Promise.all([
      admin.from("showroom").select("*").eq("id", id).maybeSingle(),
      admin
        .from("product_images")
        .select("id, image_url, display_order, description")
        .eq("product_id", id)
        .order("display_order"),
    ]);
    if (!prodRes.data) return badRequest("Product not found");
    return new Response(
      JSON.stringify({ ...prodRes.data, images: imgRes.data || [] }),
      { status: 200 }
    );
  } catch (err) {
    return serverError(err.message);
  }
}
