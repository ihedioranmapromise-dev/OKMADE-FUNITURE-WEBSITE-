import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function getAllContent() {
  const { data } = await admin.from("site_content").select("*");
  const map = {};
  (data || []).forEach((row) => {
    map[row.key] = row.value;
  });
  return map;
}

export async function getContent(key, fallback = "") {
  const { data } = await admin
    .from("site_content")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  return data?.value ?? fallback;
}

export async function setContent(key, value) {
  const { error } = await admin.from("site_content").upsert({
    key,
    value,
    updated_at: new Date().toISOString(),
  });
  return !error;
}

export async function setManyContent(entries) {
  const rows = Object.entries(entries).map(([key, value]) => ({
    key,
    value,
    updated_at: new Date().toISOString(),
  }));
  if (rows.length === 0) return true;
  const { error } = await admin.from("site_content").upsert(rows);
  return !error;
}

export async function deleteContent(key) {
  const { error } = await admin.from("site_content").delete().eq("key", key);
  return !error;
}
