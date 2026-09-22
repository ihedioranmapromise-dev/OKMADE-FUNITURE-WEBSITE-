import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/send-email";
import { projectUpdateEmail } from "@/lib/email-templates";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const adminKey = request.headers.get("x-admin-key");
    if (adminKey !== process.env.ADMIN_API_KEY) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const { email, client_id, projectTitle, tokenString, description } = await request.json();
    if (!email || !projectTitle) {
      return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400 });
    }

    // Respect email preferences
    if (client_id) {
      const { data: settings } = await admin
        .from("user_settings")
        .select("email_notifications")
        .eq("user_id", client_id)
        .single();
      if (settings && settings.email_notifications === false) {
        return new Response(JSON.stringify({ skipped: true }), { status: 200 });
      }
    }

    const tpl = projectUpdateEmail({ projectTitle, description, tokenString });
    const result = await sendEmail({ to: email, subject: tpl.subject, html: tpl.html });
    return new Response(JSON.stringify(result), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
