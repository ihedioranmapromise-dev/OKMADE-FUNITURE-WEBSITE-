import { createClient } from "@supabase/supabase-js";
import { isAdmin, unauthorized, badRequest, serverError } from "@/lib/admin-guard";
import { logActivity } from "@/lib/admin-auth";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  if (!(await isAdmin(request))) return unauthorized();
  try {
    const { data } = await admin
      .from("backup_schedule")
      .select("*")
      .limit(1)
      .maybeSingle();
    return new Response(JSON.stringify(data || { enabled: false, frequency: "weekly" }), {
      status: 200,
    });
  } catch (err) {
    return serverError(err.message);
  }
}

export async function PUT(request) {
  if (!(await isAdmin(request))) return unauthorized();
  try {
    const { enabled, frequency } = await request.json();
    if (typeof enabled !== "boolean") return badRequest("enabled required");
    const freq = ["daily", "weekly", "monthly"].includes(frequency) ? frequency : "weekly";

    const { data: existing } = await admin
      .from("backup_schedule")
      .select("id")
      .limit(1)
      .maybeSingle();

    if (existing) {
      await admin
        .from("backup_schedule")
        .update({ enabled, frequency: freq })
        .eq("id", existing.id);
    } else {
      await admin.from("backup_schedule").insert({ enabled, frequency: freq });
    }

    await logActivity({
      action: "backup_schedule_updated",
      target_type: "backup",
      details: { enabled, frequency: freq },
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return serverError(err.message);
  }
}
