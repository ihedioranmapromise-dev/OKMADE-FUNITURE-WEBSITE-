export function isCrossOrigin(request) {
  const method = request.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return false;
  }

  // Admin requests are trusted via x-admin-key
  if (request.headers.get("x-admin-key")) return false;

  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const host = request.headers.get("host");
  if (!host) return false;

  const proto = request.headers.get("x-forwarded-proto") || "https";
  const expected = `${proto}://${host}`;

  if (origin) {
    return origin !== expected;
  }
  if (referer) {
    return !referer.startsWith(expected);
  }

  // No origin and no referer — allow (native app / server-to-server)
  return false;
}
