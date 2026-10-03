import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SCRYPT_KEYLEN = 64;

export function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, SCRYPT_KEYLEN);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export function verifyPassword(password, stored) {
  if (!stored || !stored.startsWith("scrypt$")) return false;
  const parts = stored.split("$");
  if (parts.length !== 3) return false;
  const salt = Buffer.from(parts[1], "hex");
  const storedHash = Buffer.from(parts[2], "hex");
  const computed = crypto.scryptSync(password, salt, SCRYPT_KEYLEN);
  if (computed.length !== storedHash.length) return false;
  return crypto.timingSafeEqual(computed, storedHash);
}

export async function getAdminSettings() {
  const { data, error } = await admin
    .from("admin_settings")
    .select("*")
    .limit(1)
    .maybeSingle();
  if (error) return null;
  return data;
}

export async function setAdminPassword(newPassword) {
  const hash = hashPassword(newPassword);
  const existing = await getAdminSettings();
  if (existing) {
    const { error } = await admin
      .from("admin_settings")
      .update({ password_hash: hash, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
    return !error;
  }
  const { error } = await admin
    .from("admin_settings")
    .insert({ password_hash: hash });
  return !error;
}

export async function verifyAdminPassword(password) {
  const settings = await getAdminSettings();

  // DB has a hash — check against it only
  if (settings?.password_hash) {
    return verifyPassword(password, settings.password_hash);
  }

  // No DB hash yet — check legacy fallback, then auto-upgrade to DB hash
  const legacy = process.env.ADMIN_PASSWORD || "OKMADE2026TERMINAL";
  if (password === legacy) {
    await setAdminPassword(password);
    return true;
  }

  return false;
}

export async function getAdminEmail() {
  const settings = await getAdminSettings();
  return settings?.admin_email || "okeywoodwork@gmail.com";
}

export async function setAdminEmail(email) {
  const existing = await getAdminSettings();
  if (!existing) return false;
  const { error } = await admin
    .from("admin_settings")
    .update({ admin_email: email, updated_at: new Date().toISOString() })
    .eq("id", existing.id);
  return !error;
}

export async function logActivity({ action, target_type, target_id, details }) {
  try {
    await admin.from("admin_activity_log").insert({
      action,
      target_type: target_type || null,
      target_id: target_id || null,
      details: details || null,
    });
  } catch {
    // Silent — logging must never break the app
  }
}
