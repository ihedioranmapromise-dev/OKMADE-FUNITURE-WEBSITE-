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
      .from("referrals")
      .select(`
        id, code, created_at,
        referrer:referrer_id (id, username, display_name),
        referred:referred_id (id, username, display_name)
      `)
      .order("created_at", { ascending: false })
      .limit(500);

    const byReferrer = {};
    (data || []).forEach((r) => {
      const key = r.referrer?.id || "unknown";
      if (!byReferrer[key]) {
        byReferrer[key] = {
          referrer: r.referrer,
          count: 0,
          referred: [],
        };
      }
      byReferrer[key].count++;
      byReferrer[key].referred.push({
        username: r.referred?.username,
        display_name: r.referred?.display_name,
        created_at: r.created_at,
      });
    });

    return new Response(
      JSON.stringify({
        total: data?.length || 0,
        byReferrer: Object.values(byReferrer).sort((a, b) => b.count - a.count),
        all: data || [],
      }),
      { status: 200 }
    );
  } catch (err) {
    return serverError(err.message);
  }
}
