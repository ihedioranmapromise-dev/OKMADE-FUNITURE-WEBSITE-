import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const localCache = new Map();
const LOCAL_CACHE_MS = 30_000;
let opCounter = 0;

export async function rateLimit(key, max = 60, windowMs = 60_000) {
  const now = Date.now();

  const cached = localCache.get(key);
  if (cached && now < cached.resetAt) {
    cached.count++;
    return {
      allowed: cached.count <= max,
      remaining: Math.max(0, max - cached.count),
      resetAt: cached.resetAt,
    };
  }

  const { data: existing } = await admin
    .from("rate_limits")
    .select("count, reset_at")
    .eq("key", key)
    .maybeSingle();

  let count = 1;
  let resetAtISO = new Date(now + windowMs).toISOString();

  if (existing && new Date(existing.reset_at).getTime() > now) {
    count = existing.count + 1;
    resetAtISO = existing.reset_at;
  }

  await admin
    .from("rate_limits")
    .upsert({ key, count, reset_at: resetAtISO });

  const resetAtMs = new Date(resetAtISO).getTime();
  localCache.set(key, { count, resetAt: resetAtMs });

  if (localCache.size > 5000) {
    for (const [k, v] of localCache) {
      if (now >= v.resetAt) localCache.delete(k);
    }
  }

  opCounter++;
  if (opCounter % 100 === 0) {
    admin
      .from("rate_limits")
      .delete()
      .lt("reset_at", new Date(now).toISOString())
      .then(() => {})
      .catch(() => {});
  }

  return {
    allowed: count <= max,
    remaining: Math.max(0, max - count),
    resetAt: resetAtMs,
  };
}

export function getIp(request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export function rateLimitResponse(resetAt) {
  const retryAfter = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));
  return new Response(
    JSON.stringify({
      error: "Too many requests. Please slow down.",
      retry_after: retryAfter,
    }),
    {
      status: 429,
      headers: { "Retry-After": String(retryAfter) },
    }
  );
}
