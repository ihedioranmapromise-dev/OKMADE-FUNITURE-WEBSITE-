import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { generateReferralCode } from "@/lib/referrals";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const sb = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll() {},
        },
      }
    );
    const { data: { user } } = await sb.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Not logged in" }), { status: 401 });
    }

    const { data: client } = await admin
      .from("clients")
      .select("id, username, referral_code")
      .eq("auth_id", user.id)
      .maybeSingle();
    if (!client) {
      return new Response(JSON.stringify({ error: "Profile not found" }), { status: 404 });
    }

    let code = client.referral_code;
    if (!code) {
      for (let i = 0; i < 5; i++) {
        const candidate = generateReferralCode(client.username);
        const { error } = await admin
          .from("clients")
          .update({ referral_code: candidate })
          .eq("id", client.id);
        if (!error) {
          code = candidate;
          break;
        }
      }
    }

    const { count } = await admin
      .from("referrals")
      .select("*", { count: "exact", head: true })
      .eq("referrer_id", client.id);

    return new Response(
      JSON.stringify({ code, count: count || 0 }),
      { status: 200 }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
