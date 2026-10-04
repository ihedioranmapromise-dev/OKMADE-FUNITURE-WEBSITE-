import { createClient } from "@supabase/supabase-js";
import { isAdmin, unauthorized, serverError } from "@/lib/admin-guard";
import { logActivity } from "@/lib/admin-auth";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TABLES = [
  "clients",
  "projects",
  "showroom",
  "catalogs",
  "categories",
  "ratings",
  "posts",
  "post_comments",
  "public_comments",
  "project_likes",
  "product_likes",
  "follows",
  "friends",
  "messages",
  "notifications",
  "review_reactions",
  "review_comments",
  "site_content",
  "admin_settings",
];

export async function GET(request) {
  if (!(await isAdmin(request))) return unauthorized();
  const { data } = await admin
    .from("admin_backups")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);
  return new Response(JSON.stringify(data || []), { status: 200 });
}

export async function POST(request) {
  if (!(await isAdmin(request))) return unauthorized();
  try {
    const dump = {};
    let total = 0;
    for (const t of TABLES) {
      const { data } = await admin.from(t).select("*");
      dump[t] = data || [];
      total += (data || []).length;
    }
    const payload = JSON.stringify({ created_at: new Date().toISOString(), tables: dump });
    const size = new Blob([payload]).size;

    const { data, error } = await admin
      .from("admin_backups")
      .insert({
        filename: `backup_${new Date().toISOString().slice(0, 10)}.json`,
        size_bytes: size,
        record_count: total,
      })
      .select()
      .single();
    if (error) return serverError(error.message);

    await logActivity({ action: "backup_created", target_type: "backup", target_id: data.id });

    return new Response(payload, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${data.filename}"`,
      },
    });
  } catch (err) {
    return serverError(err.message);
  }
}
