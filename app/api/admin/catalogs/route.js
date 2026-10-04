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
    const { title, images } = await request.json();
    if (!title) return badRequest("Title required");

    const { data: catalog, error: catErr } = await admin
      .from("catalogs")
      .insert({ title })
      .select()
      .single();
    if (catErr) return serverError(catErr.message);

    if (Array.isArray(images) && images.length > 0) {
      const rows = images.map((img, i) => ({
        catalog_id: catalog.id,
        image_url: img.url,
        display_order: i,
        description: img.description || null,
      }));
      const { error: imgErr } = await admin.from("catalog_images").insert(rows);
      if (imgErr) return serverError(imgErr.message);
    }

    await logActivity({
      action: "catalog_created",
      target_type: "catalog",
      target_id: catalog.id,
      details: { title },
    });

    return new Response(JSON.stringify(catalog), { status: 200 });
  } catch (err) {
    return serverError(err.message);
  }
}

export async function PUT(request) {
  if (!(await isAdmin(request))) return unauthorized();
  try {
    const { id, title } = await request.json();
    if (!id || !title) return badRequest("id and title required");
    const { error } = await admin.from("catalogs").update({ title }).eq("id", id);
    if (error) return serverError(error.message);
    await logActivity({ action: "catalog_updated", target_type: "catalog", target_id: id, details: { title } });
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
      .from("catalog_images")
      .select("image_url")
      .eq("catalog_id", id);

    if (imgs && imgs.length > 0) {
      const paths = imgs
        .map((i) => i.image_url.split("/public/")[1])
        .filter(Boolean);
      if (paths.length > 0) {
        await admin.storage.from("catalog-bucket").remove(paths);
      }
    }

    await admin.from("catalog_images").delete().eq("catalog_id", id);
    const { error } = await admin.from("catalogs").delete().eq("id", id);
    if (error) return serverError(error.message);

    await logActivity({ action: "catalog_deleted", target_type: "catalog", target_id: id });
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return serverError(err.message);
  }
}
