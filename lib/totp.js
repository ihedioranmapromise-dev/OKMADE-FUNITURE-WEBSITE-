import crypto from "crypto";

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function generateSecret(length = 20) {
  const bytes = crypto.randomBytes(length);
  let secret = "";
  for (const b of bytes) {
    secret += BASE32_ALPHABET[b % 32];
  }
  return secret;
}

function base32Decode(input) {
  const cleaned = input.replace(/=+$/, "").toUpperCase();
  let bits = "";
  for (const c of cleaned) {
    const idx = BASE32_ALPHABET.indexOf(c);
    if (idx === -1) continue;
    bits += idx.toString(2).padStart(5, "0");
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

function hotp(secretBuffer, counter) {
  const buf = Buffer.alloc(8);
  buf.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
  buf.writeUInt32BE(counter & 0xffffffff, 4);
  const hmac = crypto.createHmac("sha1", secretBuffer).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return (code % 1000000).toString().padStart(6, "0");
}

export function generateTotp(secret, timeStep = 30, at = Date.now()) {
  const counter = Math.floor(at / 1000 / timeStep);
  return hotp(base32Decode(secret), counter);
}

export function verifyTotp(token, secret, window = 1) {
  if (!token || !secret) return false;
  const cleaned = String(token).replace(/\s/g, "");
  if (!/^\d{6}$/.test(cleaned)) return false;
  const now = Date.now();
  for (let i = -window; i <= window; i++) {
    const expected = generateTotp(secret, 30, now + i * 30 * 1000);
    if (expected === cleaned) return true;
  }
  return false;
}

export function otpauthUrl({ secret, label, issuer }) {
  const enc = encodeURIComponent;
  return `otpauth://totp/${enc(issuer)}:${enc(label)}?secret=${secret}&issuer=${enc(issuer)}&algorithm=SHA1&digits=6&period=30`;
}

export function generateBackupCodes(count = 8) {
  const codes = [];
  for (let i = 0; i < count; i++) {
    codes.push(crypto.randomBytes(5).toString("hex").match(/.{1,5}/g).join("-"));
  }
  return codes;
}
