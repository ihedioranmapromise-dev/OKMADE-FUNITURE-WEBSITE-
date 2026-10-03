const STORAGE_KEY = "okmade_offline_queue";

function read() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function write(items) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(
    new CustomEvent("okmade-queue-change", { detail: items.length })
  );
}

export function enqueue({ url, method = "POST", body, label }) {
  const items = read();
  const item = {
    id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
    url,
    method,
    body,
    label: label || "action",
    created_at: Date.now(),
  };
  items.push(item);
  write(items);
  return item;
}

export function getQueue() {
  return read();
}

export function getQueueCount() {
  return read().length;
}

export function clearQueue() {
  write([]);
}

export async function flushQueue() {
  const items = read();
  if (items.length === 0) return { sent: 0, failed: 0, remaining: 0 };

  let sent = 0;
  let failed = 0;
  const remaining = [];

  for (const item of items) {
    try {
      const res = await fetch(item.url, {
        method: item.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item.body),
      });
      if (res.ok) {
        sent++;
      } else if (res.status >= 400 && res.status < 500) {
        // Client error — give up, don't retry forever
        failed++;
      } else {
        // Server error — keep for next attempt
        remaining.push(item);
      }
    } catch {
      // Network error — keep for next attempt
      remaining.push(item);
    }
  }

  write(remaining);
  return { sent, failed, remaining: remaining.length };
}

export function subscribe(callback) {
  if (typeof window === "undefined") return () => {};
  const handler = (e) => callback(e.detail);
  window.addEventListener("okmade-queue-change", handler);
  callback(read().length);
  return () => window.removeEventListener("okmade-queue-change", handler);
}
