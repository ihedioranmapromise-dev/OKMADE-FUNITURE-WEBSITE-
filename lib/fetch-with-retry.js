let slowEventFired = false;

function isAuthPath() {
  if (typeof window === "undefined") return false;
  const p = window.location.pathname;
  return (
    p.startsWith("/client/login") ||
    p.startsWith("/client/signup") ||
    p.startsWith("/client/verify-email") ||
    p.startsWith("/client/forgot-password") ||
    p.startsWith("/client/reset-password") ||
    p.startsWith("/admin/login")
  );
}

async function handle401() {
  if (typeof window === "undefined") return;
  if (isAuthPath()) return;

  try {
    const { createBrowserClient } = await import("@supabase/ssr");
    const sb = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    await sb.auth.signOut();
  } catch {}

  const current = window.location.pathname + window.location.search;
  const next = encodeURIComponent(current);
  window.location.href = `/client/login?expired=1&next=${next}`;
}

export async function fetchWithRetry(url, options = {}, config = {}) {
  const { retries = 3, timeout = 15000, slowThreshold = 5000 } = config;
  let lastErr;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    const start = Date.now();

    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timer);

      const elapsed = Date.now() - start;
      if (elapsed > slowThreshold && !slowEventFired && typeof window !== "undefined") {
        slowEventFired = true;
        window.dispatchEvent(new CustomEvent("okmade-slow"));
        setTimeout(() => {
          slowEventFired = false;
        }, 30000);
      }

      // Session expired — log out and redirect
      if (res.status === 401) {
        await handle401();
        return res;
      }

      // 4xx → don't retry (client error)
      if (res.status >= 400 && res.status < 500) return res;

      // 5xx → retry with backoff
      if (!res.ok && attempt < retries) {
        await new Promise((r) => setTimeout(r, 500 * Math.pow(2, attempt)));
        continue;
      }
      return res;
    } catch (err) {
      clearTimeout(timer);
      lastErr = err;
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 500 * Math.pow(2, attempt)));
      }
    }
  }

  throw lastErr || new Error("Network error");
}
