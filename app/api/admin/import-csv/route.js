import { createClient } from "@supabase/supabase-js";
import { isAdmin, unauthorized, badRequest, serverError } from "@/lib/admin-guard";
import { logActivity } from "@/lib/admin-auth";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function parseCSV(text) {
  const lines = text.replace(/\r/g, "").split("\n").filter((l) => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };

  const parseLine = (line) => {
    const out = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (inQuotes) {
        if (c === '"' && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else if (c === '"') {
          inQuotes = false;
        } else {
          cur += c;
        }
      } else {
        if (c === '"') inQuotes = true;
        else if (c === ",") {
          out.push(cur);
          cur = "";
        } else cur += c;
      }
    }
    out.push(cur);
    return out;
  };

  const headers = parseLine(lines[0]).map((h) => h.trim());
  const rows = lines.slice(1).map((line) => {
    const vals = parseLine(line);
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = (vals[i] ?? "").trim();
    });
    return obj;
  });
  return { headers, rows };
}

export async function POST(request) {
  if (!(await isAdmin(request))) return unauthorized();
  try {
    const { type, csv } = await request.json();
    if (!type || !csv) return badRequest("Missing fields");
    if (!["products", "catalogs"].includes(type)) {
      return badRequest("Unknown type");
    }

    const { headers, rows } = parseCSV(csv);
    if (rows.length === 0) return badRequest("No rows found");

    let inserted = 0;
    let failed = 0;

    if (type === "products") {
      if (!headers.includes("description") || !headers.includes("price")) {
        return badRequest("Required columns: description, price");
      }
      for (const row of rows) {
        const description = row.description;
        const price = parseFloat(row.price);
        const sold = row.sold === "true" || row.sold === "1";
        const featured = row.featured === "true" || row.featured === "1";
        if (!description || isNaN(price)) {
          failed++;
          continue;
        }
        const { error } = await admin.from("showroom").insert({
          description,
          price,
          sold,
          featured,
        });
        if (error) failed++;
        else inserted++;
      }
    }

    if (type === "catalogs") {
      if (!headers.includes("title")) {
        return badRequest("Required column: title");
      }
      for (const row of rows) {
        const title = row.title;
        if (!title) {
          failed++;
          continue;
        }
        const { error } = await admin.from("catalogs").insert({ title });
        if (error) failed++;
        else inserted++;
      }
    }

    await logActivity({
      action: "csv_import",
      target_type: type,
      details: { inserted, failed },
    });

    return new Response(
      JSON.stringify({ inserted, failed, total: rows.length }),
      { status: 200 }
    );
  } catch (err) {
    return serverError(err.message);
  }
}
