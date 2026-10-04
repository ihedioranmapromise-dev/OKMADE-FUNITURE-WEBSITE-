import { createClient } from "@supabase/supabase-js";
import { isAdmin, unauthorized, serverError } from "@/lib/admin-guard";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  if (!(await isAdmin(request))) return unauthorized();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  try {
    let query = admin
      .from("projects")
      .select("id, token_string, client_name, work_description, city, created_at, is_standalone, status")
      .order("created_at", { ascending: false });
    if (status) query = query.eq("status", status);
    const { data } = await query;
    return new Response(JSON.stringify(data || []), { status: 200 });
  } catch (err) {
    return serverError(err.message);
  }
}
