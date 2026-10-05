import { verifyAdminPassword, logActivity } from "@/lib/admin-auth";
import { rateLimit, getIp, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(request) {
  try {
    const ip = getIp(request);
    const { allowed, resetAt } = rateLimit(`admin-login:${ip}`, 5, 15 * 60_000);

    if (!allowed) {
      await logActivity({
        action: "admin_login_rate_limited",
        target_type: "admin",
        details: { ip },
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
      // Extra delay on failure to slow brute force
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

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
