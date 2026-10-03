import { verifyAdminPassword, logActivity } from "@/lib/admin-auth";

export async function POST(request) {
  try {
    const { password } = await request.json();

    if (!password) {
      return new Response(JSON.stringify({ error: "Password required" }), {
        status: 400,
      });
    }

    const ok = await verifyAdminPassword(password);

    if (!ok) {
      // Small delay to slow brute force
      await new Promise((r) => setTimeout(r, 600));
      return new Response(JSON.stringify({ error: "Wrong password" }), {
        status: 401,
      });
    }

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

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
