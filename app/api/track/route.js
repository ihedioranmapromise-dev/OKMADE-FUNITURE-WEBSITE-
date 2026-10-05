import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { rateLimit, getIp, rateLimitResponse } from "@/lib/rate-limit";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function hashIp(ip) {
  const salt = process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 16) || "okmade";
  return crypto.createHash("sha256").update(ip + salt).digest("hex").slice(0, 24);
}

export async function POST(request) {
  try {
    const ip = getIp(request);
    const { allowed, resetAt } = await rateLimit(`track:${ip}`, 60, 60_000);
    if (!allowed) return rateLimitResponse(resetAt);

    const body = await request.json();
    const path = (body.path || "").slice(0, 500);
    const referrer = (body.referrer || "").slice(0, 500);
    const isLoggedIn = !!body.is_logged_in;

    if (!path) {
      return new Response(JSON.stringify({ ok: false }), { status: 400 });
    }

    // Skip admin paths and API
    if (path.startsWith("/admin") || path.startsWith("/api")) {
      return new Response(JSON.stringify({ ok: true, skipped: true }), { status: 200 });
    }

    // Skip logged-in users (per our analytics decision)
    if (isLoggedIn) {
      return new Response(JSON.stringify({ ok: true, skipped: true }), { status: 200 });
    }

    const ua = (request.headers.get("user-agent") || "").slice(0, 300);

    await admin.from("page_visits").insert({
      path,
      referrer: referrer || null,
      ip_hash: hashIp(ip),
      user_agent: ua,
      is_logged_in: false,
    });

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      status: 200,
    });
  }
}
