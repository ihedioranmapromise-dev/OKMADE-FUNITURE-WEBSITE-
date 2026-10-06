import { createClient } from "@supabase/supabase-js";
import { isAdmin, unauthorized, badRequest, serverError } from "@/lib/admin-guard";
import {
  generateSecret,
  otpauthUrl,
  verifyTotp,
  generateBackupCodes,
} from "@/lib/totp";
import { logActivity } from "@/lib/admin-auth";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  if (!(await isAdmin(request))) return unauthorized();
  try {
    const { data } = await admin
      .from("admin_2fa")
      .select("enabled, secret, backup_codes")
      .limit(1)
      .maybeSingle();
    return new Response(
      JSON.stringify({
        enabled: !!data?.enabled,
        has_secret: !!data?.secret,
        backup_codes: data?.enabled ? data.backup_codes || [] : [],
      }),
      { status: 200 }
    );
  } catch (err) {
    return serverError(err.message);
  }
}

export async function POST(request) {
  if (!(await isAdmin(request))) return unauthorized();
  try {
    const { action, token } = await request.json();

    if (action === "setup") {
      const secret = generateSecret();
      const { data: existing } = await admin
        .from("admin_2fa")
        .select("id")
        .limit(1)
        .maybeSingle();

      if (existing) {
        await admin
          .from("admin_2fa")
          .update({
            secret,
            enabled: false,
            backup_codes: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
      } else {
        await admin.from("admin_2fa").insert({
          secret,
          enabled: false,
        });
      }

      const url = otpauthUrl({
        secret,
        label: "admin@okmade",
        issuer: "OKMADE Admin",
      });

      return new Response(JSON.stringify({ secret, otpauth_url: url }), {
        status: 200,
      });
    }

    if (action === "enable") {
      if (!token) return badRequest("Token required");
      const { data } = await admin
        .from("admin_2fa")
        .select("id, secret")
        .limit(1)
        .maybeSingle();
      if (!data?.secret) return badRequest("Run setup first");

      const ok = verifyTotp(token, data.secret);
      if (!ok) return badRequest("Invalid code. Check your authenticator app.");

      const backupCodes = generateBackupCodes(8);
      await admin
        .from("admin_2fa")
        .update({
          enabled: true,
          backup_codes: backupCodes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", data.id);

      await logActivity({ action: "admin_2fa_enabled", target_type: "admin" });

      return new Response(JSON.stringify({ success: true, backup_codes: backupCodes }), {
        status: 200,
      });
    }

    if (action === "disable") {
      if (!token) return badRequest("Token required");
      const { data } = await admin
        .from("admin_2fa")
        .select("id, secret, backup_codes")
        .limit(1)
        .maybeSingle();
      if (!data) return badRequest("2FA not set up");

      const usingBackup = (data.backup_codes || []).includes(token);
      const ok = usingBackup || verifyTotp(token, data.secret);
      if (!ok) return badRequest("Invalid code");

      const remaining = usingBackup
        ? (data.backup_codes || []).filter((c) => c !== token)
        : [];

      await admin
        .from("admin_2fa")
        .update({
          enabled: false,
          backup_codes: remaining.length ? remaining : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", data.id);

      await logActivity({ action: "admin_2fa_disabled", target_type: "admin" });

      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    return badRequest("Unknown action");
  } catch (err) {
    return serverError(err.message);
  }
}
