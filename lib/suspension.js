import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function checkUserStatus(authId) {
  if (!authId) return { ok: false, reason: "no_user" };

  const { data: client } = await admin
    .from("clients")
    .select("id, suspended, deletion_requested_at")
    .eq("auth_id", authId)
    .maybeSingle();

  if (!client) return { ok: false, reason: "no_profile" };
  if (client.suspended) return { ok: false, reason: "suspended", client_id: client.id };
  if (client.deletion_requested_at)
    return { ok: false, reason: "deleting", client_id: client.id };

  return { ok: true, client_id: client.id };
}

export async function checkIpBlocked(ip) {
  if (!ip || ip === "unknown") return false;
  const { data } = await admin
    .from("blocked_ips")
    .select("id")
    .eq("ip", ip)
    .maybeSingle();
  return !!data;
}
