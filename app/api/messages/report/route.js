import { createSupabaseServer } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, getIp, rateLimitResponse } from "@/lib/rate-limit";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const ip = getIp(request);
    const { allowed, resetAt } = await rateLimit(`msg-report:${ip}`, 5, 60 * 60_000);
    if (!allowed) return rateLimitResponse(resetAt);

    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

    const { data: me } = await admin
      .from("clients")
      .select("id")
      .eq("auth_id", user.id)
      .single();
    if (!me) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });

    const { message_id, reason, details } = await request.json();
    if (!message_id || !reason) {
      return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400 });
    }

    const { data: msg } = await admin
      .from("messages")
      .select("id, sender_id, thread_id")
      .eq("id", message_id)
      .maybeSingle();
    if (!msg) return new Response(JSON.stringify({ error: "Message not found" }), { status: 404 });
    if (msg.sender_id === me.id) {
      return new Response(JSON.stringify({ error: "Cannot report your own message" }), { status: 400 });
    }

    await admin.from("message_reports").insert({
      message_id,
      reporter_id: me.id,
      reason,
      details: details || null,
    });

    await admin.from("admin_inbox").insert({
      type: "message_report",
      title: `Message reported: ${reason}`,
      body: details ? String(details).slice(0, 200) : "A message was reported.",
      link: "/admin/dashboard?tab=message-reports",
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
