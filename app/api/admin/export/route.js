import { createClient } from "@supabase/supabase-js";
import { isAdmin, unauthorized, badRequest } from "@/lib/admin-guard";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ALLOWED = [
  "clients",
  "projects",
  "showroom",
  "catalogs",
  "ratings",
  "posts",
  "project_likes",
  "product_likes",
];

function toCSV(rows) {
  if (!rows || rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v) => {
    if (v === null || v === undefined) return "";
    const s = typeof v === "object" ? JSON.stringify(v) : String(v);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const lines = [headers.join(",")];
  rows.forEach((r) => {
    lines.push(headers.map((h) => escape(r[h])).join(","));
  });
  return lines.join("\n");
}

export async function GET(request) {
  if (!(await isAdmin(request))) return unauthorized();
  const { searchParams } = new URL(request.url);
  const table = searchParams.get("table");
  if (!table || !ALLOWED.includes(table)) {
    return badRequest("Invalid table");
  }
  const { data, error } = await admin.from(table).select("*");
  if (error) return badRequest(error.message);
  const csv = toCSV(data || []);
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${table}_${Date.now()}.csv"`,
    },
  });
}
