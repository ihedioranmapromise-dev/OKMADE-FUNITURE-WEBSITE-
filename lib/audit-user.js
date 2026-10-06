import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function logUserAction({
  user_id,
  username,
  action,
  ip,
  user_agent,
  details,
}) {
  try {
    await admin.from("user_audit_log").insert({
      user_id: user_id || null,
      username: username || null,
      action,
      ip: ip || null,
      user_agent: user_agent || null,
      details: details || null,
    });
  } catch {}
}
