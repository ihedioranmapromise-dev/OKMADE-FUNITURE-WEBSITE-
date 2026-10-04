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
    const [catRes, imgRes] = await Promise.all([
      admin.from("catalogs").select("*").eq("id", id).maybeSingle(),
      admin
        .from("catalog_images")
        .select("id, image_url, display_order, description")
        .eq("catalog_id", id)
        .order("display_order"),
    ]);
    if (!catRes.data) return badRequest("Catalog not found");
    return new Response(
      JSON.stringify({ ...catRes.data, images: imgRes.data || [] }),
      { status: 200 }
    );
  } catch (err) {
    return serverError(err.message);
  }
}
