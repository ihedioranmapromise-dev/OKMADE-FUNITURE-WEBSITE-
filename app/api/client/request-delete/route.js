import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { sendEmail } from "@/lib/send-email";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function makeCancelToken() {
  return crypto.randomBytes(32).toString("hex");
}

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const sb = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll() {},
        },
      }
    );
    const { data: { user } } = await sb.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Not logged in" }), { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const reason = (body.reason || "").slice(0, 500);

    const { data: client } = await admin
      .from("clients")
      .select("id, username, display_name, first_name, last_name, email")
      .eq("auth_id", user.id)
      .maybeSingle();

    if (!client) {
      return new Response(JSON.stringify({ error: "Profile not found" }), { status: 404 });
    }

    if (client.deletion_requested_at) {
      return new Response(
        JSON.stringify({ error: "Deletion already scheduled" }),
        { status: 400 }
      );
    }

    const now = new Date();
    const scheduledFor = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const cancelToken = makeCancelToken();

    const { error: updateErr } = await admin
      .from("clients")
      .update({
        deletion_requested_at: now.toISOString(),
        deletion_scheduled_for: scheduledFor.toISOString(),
        deletion_reason: reason || null,
        deletion_cancel_token: cancelToken,
      })
      .eq("id", client.id);

    if (updateErr) {
      return new Response(JSON.stringify({ error: updateErr.message }), { status: 500 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://okmade.vercel.app";
    const cancelUrl = `${baseUrl}/cancel-delete?token=${cancelToken}`;

    const emailHtml = `
<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;background:#FFFBEB;padding:40px 20px;margin:0;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;padding:40px 30px;">
    <h2 style="color:#991B1B;margin:0 0 16px 0;">Account Deletion Scheduled</h2>
    <p style="color:#4B5563;font-size:15px;line-height:1.6;">
      Hi ${client.display_name || client.username}, we've received your request to delete your OKMADE account.
    </p>
    <p style="color:#4B5563;font-size:15px;line-height:1.6;">
      Your account will be <strong>permanently deleted on ${scheduledFor.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</strong>.
    </p>
    <p style="color:#4B5563;font-size:15px;line-height:1.6;">
      Changed your mind? Click below to cancel. This link works until the deletion date.
    </p>
    <div style="text-align:center;margin:30px 0;">
      <a href="${cancelUrl}" style="display:inline-block;background:#D97706;color:#fff;padding:14px 32px;border-radius:999px;text-decoration:none;font-weight:bold;font-size:15px;">Cancel Deletion</a>
    </div>
    <p style="color:#9CA3AF;font-size:12px;line-height:1.6;margin-top:30px;">
      If you didn't request this, please contact us immediately at okeywoodwork@gmail.com.
    </p>
  </div>
</body>
</html>`;

    await sendEmail({
      to: client.email || user.email,
      subject: "Your OKMADE account is scheduled for deletion",
      html: emailHtml,
    });

    return new Response(
      JSON.stringify({
        success: true,
        scheduled_for: scheduledFor.toISOString(),
      }),
      { status: 200 }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
