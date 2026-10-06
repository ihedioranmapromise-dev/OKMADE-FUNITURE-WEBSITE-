import crypto from "crypto";

export function generateReferralCode(username) {
  const clean = (username || "user").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 6);
  const rand = crypto.randomBytes(3).toString("hex").slice(0, 4).toUpperCase();
  return `${clean}${rand}`;
}
