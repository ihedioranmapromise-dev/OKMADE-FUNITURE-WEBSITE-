import { createClient } from "@supabase/supabase-js";
import { isAdmin, unauthorized, badRequest, serverError } from "@/lib/admin-guard";
import { logActivity } from "@/lib/admin-auth";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  if (!(await isAdmin(request))) return unauthorized();
  const { searchParams } = new URL(request.url);
  const project_id = searchParams.get("project_id");
  if (!project_id) return badRequest("project_id required");
  const { data } = await admin
    .from("projects")
    .select("id, work_description, timeline")
    .eq("id", project_id)
    .maybeSingle();
  return new Response(JSON.stringify(data || {}), { status: 200 });
}

export async function PUT(request) {
  if (!(await isAdmin(request))) return unauthorized();
  const { project_id, timeline } = await request.json();
  if (!project_id || !Array.isArray(timeline)) return badRequest("project_id and timeline[] required");
  const { error } = await admin
    .from("projects")
    .update({ timeline })
    .eq("id", project_id);
  if (error) return serverError(error.message);
  await logActivity({ action: "timeline_updated", target_type: "project", target_id: project_id });
  return new Response(JSON.stringify({ success: true }), { status: 200 });
}
