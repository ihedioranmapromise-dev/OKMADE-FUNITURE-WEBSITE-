import { createClient } from "@supabase/supabase-js";
import { isAdmin, unauthorized, serverError } from "@/lib/admin-guard";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  if (!(await isAdmin(request))) return unauthorized();
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get("user_id");

    let query = admin
      .from("user_audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300);

    if (user_id) query = query.eq("user_id", user_id);

    const { data } = await query;
    return new Response(JSON.stringify(data || []), { status: 200 });
  } catch (err) {
    return serverError(err.message);
  }
}
