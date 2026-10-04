import { createClient } from "@supabase/supabase-js";
import { isAdmin, unauthorized, badRequest, serverError } from "@/lib/admin-guard";
import { logActivity } from "@/lib/admin-auth";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  if (!(await isAdmin(request))) return unauthorized();
  const { client_id, message, target_url } = await request.json();
  if (!client_id || !message) return badRequest("client_id and message required");
  const { error } = await admin.from("notifications").insert({
    client_id,
    type: "admin_notice",
    message,
    target_url: target_url || null,
  });
  if (error) return serverError(error.message);
  await logActivity({ action: "notification_sent", target_type: "user", target_id: client_id });
  return new Response(JSON.stringify({ success: true }), { status: 200 });
}
