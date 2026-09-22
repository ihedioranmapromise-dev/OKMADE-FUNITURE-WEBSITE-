import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/send-email";
import { okmadeAnnouncementEmail } from "@/lib/email-templates";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    // Verify admin key
    const adminKey = request.headers.get("x-admin-key");
    if (adminKey !== process.env.ADMIN_API_KEY) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const { title, body, ctaUrl } = await request.json();
    if (!title || !body) {
      return new Response(JSON.stringify({ error: "Missing title or body" }), { status: 400 });
    }

    // Get OKMADE's id
    const { data: okmade } = await admin
      .from("clients")
      .select("id")
      .eq("is_okmade", true)
      .single();
    if (!okmade) {
      return new Response(JSON.stringify({ error: "OKMADE profile not found" }), { status: 404 });
    }

    // Get all followers of OKMADE with their emails + notification preferences
    const { data: followers } = await admin
      .from("follows")
      .select("follower_id, clients:follower_id (id, email, display_name, username)")
      .eq("following_id", okmade.id);

    if (!followers || followers.length === 0) {
      return new Response(JSON.stringify({ sent: 0, message: "No followers yet." }), { status: 200 });
    }

    const tpl = okmadeAnnouncementEmail({ title, body, ctaUrl });

    let sent = 0;
    let skipped = 0;
    let failed = 0;

    for (const f of followers) {
      const user = f.clients;
      if (!user?.email) {
        skipped++;
        continue;
      }

      // Respect user's email preference
      const { data: settings } = await admin
        .from("user_settings")
        .select("email_notifications")
        .eq("user_id", user.id)
        .single();
      const wantsEmail = settings?.email_notifications ?? true;
      if (!wantsEmail) {
        skipped++;
        continue;
      }

      const result = await sendEmail({
        to: user.email,
        subject: tpl.subject,
        html: tpl.html,
      });
      if (result.error) failed++;
      else sent++;
    }

    return new Response(
      JSON.stringify({ sent, skipped, failed, total: followers.length }),
      { status: 200 }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
