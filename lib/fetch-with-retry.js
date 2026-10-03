let slowEventFired = false;

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
        setTimeout(() => { slowEventFired = false; }, 30000);
      }

      // 4xx → don't retry (client error, will keep failing)
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
