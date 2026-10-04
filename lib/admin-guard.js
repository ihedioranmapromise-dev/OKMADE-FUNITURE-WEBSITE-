import { verifyAdminPassword } from "./admin-auth";

export async function isAdmin(request) {
  const key = request.headers.get("x-admin-key");
  if (!key) return false;
  try {
    return await verifyAdminPassword(key);
  } catch {
    return false;
  }
}

export function unauthorized() {
  return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
}

export function badRequest(msg = "Bad request") {
  return new Response(JSON.stringify({ error: msg }), { status: 400 });
}

export function serverError(msg = "Server error") {
  return new Response(JSON.stringify({ error: msg }), { status: 500 });
}
