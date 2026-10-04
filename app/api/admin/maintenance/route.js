import { isAdmin, unauthorized, badRequest } from "@/lib/admin-guard";
import { getContent, setContent } from "@/lib/site-content";
import { logActivity } from "@/lib/admin-auth";

export async function GET(request) {
  if (!(await isAdmin(request))) return unauthorized();
  const enabled = (await getContent("maintenance_mode", "off")) === "on";
  const message = await getContent("maintenance_message", "We'll be back shortly.");
  return new Response(JSON.stringify({ enabled, message }), { status: 200 });
}

export async function PUT(request) {
  if (!(await isAdmin(request))) return unauthorized();
  const { enabled, message } = await request.json();
  if (typeof enabled !== "boolean") return badRequest("enabled required");
  await setContent("maintenance_mode", enabled ? "on" : "off");
  if (typeof message === "string") await setContent("maintenance_message", message);
  await logActivity({ action: "maintenance_toggled", target_type: "site", details: { enabled } });
  return new Response(JSON.stringify({ success: true }), { status: 200 });
}
