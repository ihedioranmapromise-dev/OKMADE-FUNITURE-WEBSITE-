import {
  verifyAdminPassword,
  setAdminPassword,
  logActivity,
} from "@/lib/admin-auth";

export async function POST(request) {
  try {
    const adminKey = request.headers.get("x-admin-key");
    if (!adminKey) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    // Verify current session password is still valid
    const sessionOk = await verifyAdminPassword(adminKey);
    if (!sessionOk) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const { current_password, new_password } = await request.json();

    if (!current_password || !new_password) {
      return new Response(
        JSON.stringify({ error: "Current and new passwords required" }),
        { status: 400 }
      );
    }

    if (new_password.length < 12) {
      return new Response(
        JSON.stringify({ error: "New password must be at least 12 characters" }),
        { status: 400 }
      );
    }

    const currentOk = await verifyAdminPassword(current_password);
    if (!currentOk) {
      return new Response(
        JSON.stringify({ error: "Current password is incorrect" }),
        { status: 401 }
      );
    }

    const saved = await setAdminPassword(new_password);
    if (!saved) {
      return new Response(
        JSON.stringify({ error: "Failed to save new password" }),
        { status: 500 }
      );
    }

    await logActivity({
      action: "admin_password_changed",
      target_type: "admin",
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
