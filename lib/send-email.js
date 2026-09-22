import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "missing");
const FROM = process.env.EMAIL_FROM || "OKMADE Support <onboarding@resend.dev>";

export async function sendEmail({ to, subject, html }) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY missing – email not sent");
    return { error: "Missing API key" };
  }
  if (!to) return { error: "No recipient" };

  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to,
      subject,
      html,
    });
    if (error) {
      console.error("Resend error:", error);
      return { error: error.message };
    }
    return { data };
  } catch (err) {
    console.error("sendEmail exception:", err);
    return { error: err.message };
  }
}
