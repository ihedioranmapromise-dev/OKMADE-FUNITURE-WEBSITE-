import { createClient } from "@supabase/supabase-js";
import { rateLimit, getIp, rateLimitResponse } from "@/lib/rate-limit";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const ip = getIp(request);
    const { allowed, resetAt } = await rateLimit(`search-track:${ip}`, 30, 60_000);
    if (!allowed) return rateLimitResponse(resetAt);

    const { query, section, result_count } = await request.json();
    const q = (query || "").trim().slice(0, 200);
    if (!q || q.length < 2) {
      return new Response(JSON.stringify({ ok: false }), { status: 400 });
    }

    await admin.from("search_queries").insert({
      query: q,
      section: (section || "").slice(0, 50),
      result_count: parseInt(result_count, 10) || 0,
    });

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      status: 200,
    });
  }
}
