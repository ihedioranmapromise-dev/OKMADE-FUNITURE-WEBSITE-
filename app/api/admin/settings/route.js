import { isAdmin, unauthorized, badRequest, serverError } from "@/lib/admin-guard";
import { getAdminSettings, setAdminEmail } from "@/lib/admin-auth";

export async function GET(request) {
  if (!(await isAdmin(request))) return unauthorized();
  const s = await getAdminSettings();
  return new Response(
    JSON.stringify({ admin_email: s?.admin_email || "okeywoodwork@gmail.com" }),
    { status: 200 }
  );
}

export async function PUT(request) {
  if (!(await isAdmin(request))) return unauthorized();
  const { admin_email } = await request.json();
  if (!admin_email) return badRequest("admin_email required");
  const ok = await setAdminEmail(admin_email);
  if (!ok) return serverError("Failed to save");
  return new Response(JSON.stringify({ success: true }), { status: 200 });
}
