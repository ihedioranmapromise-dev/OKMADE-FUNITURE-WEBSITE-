"use client";

export function getAdminKey() {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem("adminKey") || "";
}

export async function adminFetch(url, options = {}) {
  const key = getAdminKey();
  const headers = {
    ...(options.headers || {}),
    "x-admin-key": key,
  };
  if (options.body && typeof options.body === "string") {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
  }
  const res = await fetch(url, { ...options, headers });
  return res;
}
