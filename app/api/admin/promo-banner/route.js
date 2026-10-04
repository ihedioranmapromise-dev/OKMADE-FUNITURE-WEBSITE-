import { createClient } from "@supabase/supabase-js";
import { isAdmin, unauthorized, badRequest, serverError } from "@/lib/admin-guard";
import { logActivity } from "@/lib/admin-auth";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  if (!(await isAdmin(request))) return unauthorized();
  const { data } = await admin.from("promo_banners").select("*").order("created_at", { ascending: false });
  return new Response(JSON.stringify(data || []), { status: 200 });
}

export async function POST(request) {
  if (!(await isAdmin(request))) return unauthorized();
  const { message, cta_text, cta_url, active, expires_at } = await request.json();
  if (!message) return badRequest("message required");
  const { data, error } = await admin
    .from("promo_banners")
    .insert({
      message,
      cta_text,
      cta_url,
      active: active !== false,
      expires_at: expires_at || null,
    })
    .select()
    .single();
  if (error) return serverError(error.message);
  await logActivity({ action: "promo_banner_created", target_type: "promo_banner", target_id: data.id });
  return new Response(JSON.stringify(data), { status: 200 });
}

export async function PUT(request) {
  if (!(await isAdmin(request))) return unauthorized();
  const { id, ...updates } = await request.json();
  if (!id) return badRequest("id required");
  const { error } = await admin.from("promo_banners").update(updates).eq("id", id);
  if (error) return serverError(error.message);
  await logActivity({ action: "promo_banner_updated", target_type: "promo_banner", target_id: id });
  return new Response(JSON.stringify({ success: true }), { status: 200 });
}

export async function DELETE(request) {
  if (!(await isAdmin(request))) return unauthorized();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return badRequest("id required");
  const { error } = await admin.from("promo_banners").delete().eq("id", id);
  if (error) return serverError(error.message);
  await logActivity({ action: "promo_banner_deleted", target_type: "promo_banner", target_id: id });
  return new Response(JSON.stringify({ success: true }), { status: 200 });
}
