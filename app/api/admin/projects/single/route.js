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
    const [projRes, reqImgs, progImgs, categories] = await Promise.all([
      admin.from("projects").select("*").eq("id", id).maybeSingle(),
      admin
        .from("project_request_images")
        .select("id, image_url, display_order, description")
        .eq("project_id", id)
        .order("display_order"),
      admin
        .from("progress_images")
        .select("id, image_url, uploaded_at, description, explanation")
        .eq("project_id", id)
        .order("uploaded_at"),
      admin.from("categories").select("id, name").order("name"),
    ]);
    if (!projRes.data) return badRequest("Project not found");
    return new Response(
      JSON.stringify({
        ...projRes.data,
        request_images: reqImgs.data || [],
        progress_images: progImgs.data || [],
        categories: categories.data || [],
      }),
      { status: 200 }
    );
  } catch (err) {
    return serverError(err.message);
  }
}
