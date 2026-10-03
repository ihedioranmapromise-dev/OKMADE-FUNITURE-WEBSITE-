import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { sendEmail } from "@/lib/send-email";

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {
            // no-op in route handler
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Not logged in" }), {
        status: 401,
      });
    }

    const body = await request.json().catch(() => ({}));
    const reason = (body.reason || "").slice(0, 500);

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: client } = await admin
      .from("clients")
      .select("username, display_name, first_name, last_name, email, phone_number")
      .eq("auth_id", user.id)
      .maybeSingle();

    const username = client?.username || "(unknown)";
    const displayName =
      client?.display_name ||
      `${client?.first_name || ""} ${client?.last_name || ""}`.trim() ||
      "(no name)";
    const clientEmail = client?.email || user.email || "(no email)";
    const phone = client?.phone_number || "(no phone)";

    const adminEmail =
      process.env.ADMIN_EMAIL || "okeywoodwork@gmail.com";

    const subject = `Account deletion request: @${username}`;

    const html = `
<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;background:#FFFBEB;padding:40px 20px;margin:0;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px;">
    <h2 style="color:#92400E;margin:0 0 16px 0;">Account Deletion Request</h2>
    <p style="color:#4B5563;font-size:15px;line-height:1.6;margin:0 0 20px 0;">
      A user has requested that their OKMADE account be deleted.
    </p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;color:#374151;">
      <tr><td style="padding:8px 0;width:140px;color:#9CA3AF;">Username</td><td style="padding:8px 0;"><strong>@${username}</strong></td></tr>
      <tr><td style="padding:8px 0;color:#9CA3AF;">Display name</td><td style="padding:8px 0;">${displayName}</td></tr>
      <tr><td style="padding:8px 0;color:#9CA3AF;">Email</td><td style="padding:8px 0;">${clientEmail}</td></tr>
      <tr><td style="padding:8px 0;color:#9CA3AF;">Phone</td><td style="padding:8px 0;">${phone}</td></tr>
      <tr><td style="padding:8px 0;color:#9CA3AF;">Auth user id</td><td style="padding:8px 0;font-family:monospace;font-size:12px;">${user.id}</td></tr>
    </table>
    ${
      reason
        ? `<div style="margin-top:20px;padding:14px;background:#FEF3C7;border-radius:8px;border-left:4px solid #D97706;">
             <p style="margin:0 0 6px 0;font-size:13px;color:#92400E;font-weight:bold;">Reason given by user:</p>
             <p style="margin:0;font-size:14px;color:#78350F;white-space:pre-wrap;">${reason}</p>
           </div>`
        : ""
    }
    <p style="color:#6B7280;font-size:13px;line-height:1.6;margin:24px 0 0 0;">
      <strong>To complete the deletion:</strong> open the Supabase dashboard, go to
      Authentication → Users, and delete the user with the auth id above. Then
      delete the matching row from the <code>clients</code> table.
    </p>
  </div>
</body>
</html>`;

    const result = await sendEmail({
      to: adminEmail,
      subject,
      html,
    });

    if (result.error) {
      return new Response(
        JSON.stringify({ error: "Email failed to send: " + result.error }),
        { status: 500 }
      );
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}
