import { createClient } from "@supabase/supabase-js";
import { isAdmin, unauthorized, serverError } from "@/lib/admin-guard";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  if (!(await isAdmin(request))) return unauthorized();
  try {
    const { data } = await admin
      .from("showroom")
      .select("id, description, price, sold, featured, created_at")
      .order("created_at", { ascending: false });
    return new Response(JSON.stringify(data || []), { status: 200 });
  } catch (err) {
    return serverError(err.message);
  }
}
