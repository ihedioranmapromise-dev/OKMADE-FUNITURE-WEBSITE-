import { createClient } from "@supabase/supabase-js";
import { isAdmin, unauthorized, serverError } from "@/lib/admin-guard";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  try {
    if (!(await isAdmin(request))) return unauthorized();

    const { data, error } = await supabase
      .from("clients")
      .select(
        "id, username, display_name, first_name, last_name, phone_number, work_address"
      );

    if (error) throw error;

    const sorted = (data || []).sort((a, b) => {
      const an = (a.display_name || `${a.first_name || ""} ${a.last_name || ""}`.trim() || a.username || "").toLowerCase();
      const bn = (b.display_name || `${b.first_name || ""} ${b.last_name || ""}`.trim() || b.username || "").toLowerCase();
      return an.localeCompare(bn);
    });

    return new Response(JSON.stringify(sorted), { status: 200 });
  } catch (err) {
    return serverError(err.message);
  }
}
