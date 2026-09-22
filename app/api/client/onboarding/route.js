import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/send-email";
import { welcomeEmail } from "@/lib/email-templates";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { auth_id, field, value } = await request.json();

    if (!auth_id || !field || !value) {
      return new Response(JSON.stringify({ error: "Missing fields." }), { status: 400 });
    }

    if (field !== "profile_pic" && field !== "cover_photo") {
      return new Response(JSON.stringify({ error: "Invalid field." }), { status: 400 });
    }

    const updateData = {};
    updateData[field] = value;

    const { error } = await supabase
      .from("clients")
      .update(updateData)
      .eq("auth_id", auth_id);

    if (error) throw error;

    // If this is the last onboarding step (cover photo), send welcome email
    if (field === "cover_photo") {
      const { data: me } = await supabase
        .from("clients")
        .select("email, username, display_name, welcome_email_sent")
        .eq("auth_id", auth_id)
        .single();

      if (me?.email && !me.welcome_email_sent) {
        const tpl = welcomeEmail({
          username: me.username,
          displayName: me.display_name,
        });
        await sendEmail({ to: me.email, subject: tpl.subject, html: tpl.html });

        // Mark as sent to avoid duplicates
        await supabase
          .from("clients")
          .update({ welcome_email_sent: true })
          .eq("auth_id", auth_id);
      }
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
