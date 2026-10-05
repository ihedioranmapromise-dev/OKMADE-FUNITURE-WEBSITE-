import { verifyAdminPassword, logActivity } from "@/lib/admin-auth";
import { rateLimit, getIp, rateLimitResponse } from "@/lib/rate-limit";
import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const ip = getIp(request);
    const { allowed, resetAt } = await rateLimit(
      `admin-login:${ip}`,
      5,
      15 * 60_000
    );

    if (!allowed) {
      await logActivity({
        action: "admin_login_rate_limited",
        target_type: "admin",
        details: { ip },
      });
      await admin.from("admin_inbox").insert({
        type: "security",
        title: "Admin login rate-limited",
        body: `IP ${ip} was blocked after too many failed attempts.`,
      });
      return rateLimitResponse(resetAt);
    }

    const { password } = await request.json();

    if (!password) {
      return new Response(JSON.stringify({ error: "Password required" }), {
        status: 400,
      });
    }

    const ok = await verifyAdminPassword(password);

    if (!ok) {
      await new Promise((r) => setTimeout(r, 600));
      return new Response(JSON.stringify({ error: "Wrong password" }), {
        status: 401,
      });
    }

    await logActivity({
      action: "admin_login",
      target_type: "admin",
      details: { ip },
    });

    await admin.from("admin_inbox").insert({
      type: "login",
      title: "Admin login",
      body: `Successful login from ${ip}`,
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
