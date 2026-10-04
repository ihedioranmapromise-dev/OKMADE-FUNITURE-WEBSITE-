import { createClient } from "@supabase/supabase-js";
import { isAdmin, unauthorized, badRequest, serverError } from "@/lib/admin-guard";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  if (!(await isAdmin(request))) return unauthorized();
  const { searchParams } = new URL(request.url);
  const project_id = searchParams.get("project_id");
  if (!project_id) return badRequest("project_id required");
  try {
    const { data } = await admin
      .from("progress_images")
      .select("*")
      .eq("project_id", project_id)
      .order("uploaded_at", { ascending: false });
    return new Response(JSON.stringify(data || []), { status: 200 });
  } catch (err) {
    return serverError(err.message);
  }
}
