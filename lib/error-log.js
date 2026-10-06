import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function logError({ message, stack, path, method, ip, user_agent, details }) {
  try {
    await admin.from("error_log").insert({
      message: String(message || "Unknown error").slice(0, 2000),
      stack: stack ? String(stack).slice(0, 5000) : null,
      path: path || null,
      method: method || null,
      ip: ip || null,
      user_agent: user_agent ? String(user_agent).slice(0, 300) : null,
      details: details || null,
    });
  } catch {}
}
