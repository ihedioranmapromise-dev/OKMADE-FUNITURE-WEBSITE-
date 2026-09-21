import { createSupabaseServer } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET() {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

    const { data: me } = await admin.from("clients").select("id").eq("auth_id", user.id).single();
    if (!me) return new Response(JSON.stringify({ error: "Profile not found" }), { status: 404 });

    const { data: settings } = await admin.from("user_settings").select("*").eq("user_id", me.id).single();
    if (!settings) {
      // Create defaults
      const { data: newSettings } = await admin
        .from("user_settings")
        .insert([{ user_id: me.id }])
        .select()
        .single();
      return new Response(JSON.stringify(newSettings), { status: 200 });
    }
    return new Response(JSON.stringify(settings), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

    const body = await request.json();
    const { post_visibility, message_permission, email_notifications, push_notifications } = body;

    const { data: me } = await admin.from("clients").select("id").eq("auth_id", user.id).single();
    if (!me) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });

    const { error } = await admin
      .from("user_settings")
      .upsert({
        user_id: me.id,
        post_visibility: post_visibility || "public",
        message_permission: message_permission || "friends",
        email_notifications: email_notifications ?? true,
        push_notifications: push_notifications ?? true,
        updated_at: new Date().toISOString(),
      });

    if (error) throw error;
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
