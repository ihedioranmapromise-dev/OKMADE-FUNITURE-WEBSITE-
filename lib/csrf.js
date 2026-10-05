import crypto from "crypto";

const COOKIE_NAME = "okmade_csrf";
const HEADER_NAME = "x-csrf-token";

export function generateCsrfToken() {
  return crypto.randomBytes(32).toString("hex");
}

export function csrfCookieOptions() {
  return {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  };
}

export const CSRF_COOKIE = COOKIE_NAME;
export const CSRF_HEADER = HEADER_NAME;

export function verifyCsrf(request) {
  // Only protect state-changing methods
  const method = request.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") return true;

  // Admin requests use x-admin-key — skip CSRF for those
  if (request.headers.get("x-admin-key")) return true;

  // Same-origin check fallback
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const host = request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") || "https";
  const expected = `${proto}://${host}`;

  if (origin && origin !== expected) return false;
  if (!origin && referer && !referer.startsWith(expected)) return false;

  return true;
}
