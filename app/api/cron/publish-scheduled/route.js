import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  try {
    const now = new Date().toISOString();

    const { data: pending } = await admin
      .from("posts")
      .select("id")
      .eq("status", "scheduled")
      .lte("scheduled_for", now);

    if (!pending || pending.length === 0) {
      return new Response(JSON.stringify({ published: 0 }), { status: 200 });
    }

    await admin
      .from("posts")
      .update({ status: "published", updated_at: now })
      .in("id", pending.map((p) => p.id));

    return new Response(
      JSON.stringify({ published: pending.length }),
      { status: 200 }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
