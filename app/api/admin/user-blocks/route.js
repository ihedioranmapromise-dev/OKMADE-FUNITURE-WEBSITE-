import { createClient } from "@supabase/supabase-js";
import { isAdmin, unauthorized, serverError } from "@/lib/admin-guard";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  if (!(await isAdmin(request))) return unauthorized();
  try {
    const [blocksRes, mutesRes] = await Promise.all([
      admin
        .from("blocks")
        .select(`
          id, created_at,
          blocker:blocker_id (username, display_name),
          blocked:blocked_id (username, display_name)
        `)
        .order("created_at", { ascending: false })
        .limit(200),
      admin
        .from("mutes")
        .select(`
          id, created_at,
          muter:muter_id (username, display_name),
          muted:muted_id (username, display_name)
        `)
        .order("created_at", { ascending: false })
        .limit(200),
    ]);

    return new Response(
      JSON.stringify({
        blocks: blocksRes.data || [],
        mutes: mutesRes.data || [],
      }),
      { status: 200 }
    );
  } catch (err) {
    return serverError(err.message);
  }
}
