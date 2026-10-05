import { createClient } from "@supabase/supabase-js";
import { isAdmin, unauthorized, badRequest, serverError } from "@/lib/admin-guard";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  if (!(await isAdmin(request))) return unauthorized();
  try {
    const { product_id, images } = await request.json();
    if (!product_id || !Array.isArray(images)) return badRequest("Missing fields");

    const rows = images.map((img, i) => ({
      product_id,
      image_url: img.url,
      display_order: img.display_order ?? i,
      description: img.description || null,
    }));

    const { error } = await admin.from("product_images").insert(rows);
    if (error) return serverError(error.message);
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return serverError(err.message);
  }
}

export async function PUT(request) {
  if (!(await isAdmin(request))) return unauthorized();
  try {
    const { order } = await request.json();
    if (!Array.isArray(order)) return badRequest("order array required");

    await Promise.all(
      order.map(({ id, display_order }) =>
        admin.from("product_images").update({ display_order }).eq("id", id)
      )
    );

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

    const { data: img } = await admin
      .from("product_images")
      .select("image_url")
      .eq("id", id)
      .maybeSingle();

    if (img?.image_url) {
      const path = img.image_url.split("/public/")[1];
      if (path) await admin.storage.from("showroom-bucket").remove([path]);
    }

    await admin.from("product_images").delete().eq("id", id);
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return serverError(err.message);
  }
}
