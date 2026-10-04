import { isAdmin, unauthorized, badRequest, serverError } from "@/lib/admin-guard";
import { getAllContent, setManyContent } from "@/lib/site-content";
import { logActivity } from "@/lib/admin-auth";

export async function GET(request) {
  if (!(await isAdmin(request))) return unauthorized();
  const content = await getAllContent();
  return new Response(JSON.stringify(content), { status: 200 });
}

export async function PUT(request) {
  if (!(await isAdmin(request))) return unauthorized();
  const body = await request.json();
  if (!body || typeof body !== "object") return badRequest("Object required");
  const ok = await setManyContent(body);
  if (!ok) return serverError("Failed to save");
  await logActivity({ action: "content_updated", target_type: "site_content", details: { keys: Object.keys(body) } });
  return new Response(JSON.stringify({ success: true }), { status: 200 });
}
