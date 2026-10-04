import { createClient } from "@supabase/supabase-js";
import { isAdmin, unauthorized, badRequest, serverError } from "@/lib/admin-guard";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  if (!(await isAdmin(request))) return unauthorized();
  const { searchParams } = new URL(request.url);
  const project_id = searchParams.get("id");
  if (!project_id) return badRequest("id required");
  try {
    const [prog, req] = await Promise.all([
      admin.from("progress_images").select("image_url").eq("project_id", project_id).order("uploaded_at", { ascending: true }).limit(6),
      admin.from("project_request_images").select("image_url").eq("project_id", project_id).order("display_order").limit(6),
    ]);
    const images = (prog.data?.length ? prog.data : req.data) || [];
    return new Response(JSON.stringify(images), { status: 200 });
  } catch (err) {
    return serverError(err.message);
  }
}
