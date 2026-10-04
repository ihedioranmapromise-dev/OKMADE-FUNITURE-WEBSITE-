import { isAdmin, unauthorized, badRequest, serverError } from "@/lib/admin-guard";
import { getAllContent, setManyContent } from "@/lib/site-content";
import { logActivity } from "@/lib/admin-auth";

const LINK_KEYS = [
  "social_whatsapp",
  "social_instagram",
  "social_facebook",
  "social_tiktok",
  "social_x",
  "social_youtube",
  "social_linkedin",
  "contact_email",
  "contact_phone_1",
  "contact_phone_2",
  "contact_address",
];

export async function GET(request) {
  if (!(await isAdmin(request))) return unauthorized();
  const all = await getAllContent();
  const out = {};
  LINK_KEYS.forEach((k) => { out[k] = all[k] || ""; });
  return new Response(JSON.stringify(out), { status: 200 });
}

export async function PUT(request) {
  if (!(await isAdmin(request))) return unauthorized();
  const body = await request.json();
  const filtered = {};
  LINK_KEYS.forEach((k) => { if (k in body) filtered[k] = body[k]; });
  if (Object.keys(filtered).length === 0) return badRequest("No valid keys");
  const ok = await setManyContent(filtered);
  if (!ok) return serverError("Failed to save");
  await logActivity({ action: "social_links_updated", target_type: "site_content" });
  return new Response(JSON.stringify({ success: true }), { status: 200 });
}
