import { createClient } from "@supabase/supabase-js";
import { isAdmin, unauthorized, serverError } from "@/lib/admin-guard";
import { logActivity } from "@/lib/admin-auth";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  if (!(await isAdmin(request))) return unauthorized();
  try {
    const { data } = await admin
      .from("admin_sessions")
      .select("*")
      .order("issued_at", { ascending: false })
      .limit(20);
    return new Response(JSON.stringify(data || []), { status: 200 });
  } catch (err) {
    return serverError(err.message);
  }
}

export async function POST(request) {
  if (!(await isAdmin(request))) return unauthorized();
  try {
    const { action } = await request.json();
    if (action !== "kill_all") return new Response("Unknown action", { status: 400 });

    await admin.from("admin_sessions").insert({
      issued_at: new Date().toISOString(),
      expires_at: new Date().toISOString(),
    });

    await logActivity({
      action: "admin_sessions_killed",
      target_type: "admin",
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "All other admin sessions were signed out. You may need to log in again.",
      }),
      { status: 200 }
    );
  } catch (err) {
    return serverError(err.message);
  }
}
