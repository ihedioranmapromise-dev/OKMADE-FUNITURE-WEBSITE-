import { createClient } from "@supabase/supabase-js";
import { isAdmin, unauthorized, badRequest, serverError } from "@/lib/admin-guard";
import { logActivity } from "@/lib/admin-auth";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  if (!(await isAdmin(request))) return unauthorized();
  try {
    const { description, price, sold, images } = await request.json();
    if (!description || price === undefined || price === null) {
      return badRequest("Description and price required");
    }

    const { data: product, error: prodErr } = await admin
      .from("showroom")
      .insert({ description, price: parseFloat(price), sold: !!sold })
      .select()
      .single();
    if (prodErr) return serverError(prodErr.message);

    if (Array.isArray(images) && images.length > 0) {
      const rows = images.map((img, i) => ({
        product_id: product.id,
        image_url: img.url,
        display_order: i,
        description: img.description || null,
      }));
      const { error: imgErr } = await admin.from("product_images").insert(rows);
      if (imgErr) return serverError(imgErr.message);
    }

    await logActivity({
      action: "product_created",
      target_type: "product",
      target_id: product.id,
      details: { description },
    });

    return new Response(JSON.stringify(product), { status: 200 });
  } catch (err) {
    return serverError(err.message);
  }
}

export async function PUT(request) {
  if (!(await isAdmin(request))) return unauthorized();
  try {
    const { id, description, price, sold } = await request.json();
    if (!id) return badRequest("id required");
    const updates = {};
    if (description !== undefined) updates.description = description;
    if (price !== undefined) updates.price = price === null ? null : parseFloat(price);
    if (sold !== undefined) updates.sold = !!sold;
    if (Object.keys(updates).length === 0) return badRequest("Nothing to update");

    const { error } = await admin.from("showroom").update(updates).eq("id", id);
    if (error) return serverError(error.message);

    await logActivity({
      action: "product_updated",
      target_type: "product",
      target_id: id,
      details: updates,
    });

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

    const { data: imgs } = await admin
      .from("product_images")
      .select("image_url")
      .eq("product_id", id);

    if (imgs && imgs.length > 0) {
      const paths = imgs
        .map((i) => i.image_url.split("/public/")[1])
        .filter(Boolean);
      if (paths.length > 0) {
        await admin.storage.from("showroom-bucket").remove(paths);
      }
    }

    await admin.from("product_images").delete().eq("product_id", id);
    const { error } = await admin.from("showroom").delete().eq("id", id);
    if (error) return serverError(error.message);

    await logActivity({
      action: "product_deleted",
      target_type: "product",
      target_id: id,
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return serverError(err.message);
  }
}
