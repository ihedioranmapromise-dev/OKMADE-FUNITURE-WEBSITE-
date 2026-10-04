import { createClient } from "@supabase/supabase-js";
import { isAdmin, unauthorized, badRequest, serverError } from "@/lib/admin-guard";
import { logActivity } from "@/lib/admin-auth";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  if (!(await isAdmin(request))) return unauthorized();
  const { data } = await admin.from("seo_meta").select("*").order("page");
  return new Response(JSON.stringify(data || []), { status: 200 });
}

export async function PUT(request) {
  if (!(await isAdmin(request))) return unauthorized();
  const { page, title, description, og_image } = await request.json();
  if (!page) return badRequest("page required");
  const { error } = await admin.from("seo_meta").upsert({
    page,
    title,
    description,
    og_image,
    updated_at: new Date().toISOString(),
  });
  if (error) return serverError(error.message);
  await logActivity({ action: "seo_updated", target_type: "seo", target_id: page });
  return new Response(JSON.stringify({ success: true }), { status: 200 });
}
