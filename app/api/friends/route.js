import { createSupabaseServer } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// POST: send request or accept/decline
export async function POST(request) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

    const { action, target_username, request_id } = await request.json();
    const { data: me } = await admin.from("clients").select("id, username").eq("auth_id", user.id).single();
    if (!me) return new Response(JSON.stringify({ error: "Profile not found" }), { status: 404 });

    if (action === "send") {
      const { data: target } = await admin.from("clients").select("id").eq("username", target_username).single();
      if (!target) return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
      if (target.id === me.id) return new Response(JSON.stringify({ error: "Cannot add yourself" }), { status: 400 });

      const { data: alreadyFriends } = await admin
        .from("friends")
        .select("id")
        .or(`and(user_a.eq.${me.id},user_b.eq.${target.id}),and(user_a.eq.${target.id},user_b.eq.${me.id})`)
        .single();
      if (alreadyFriends) return new Response(JSON.stringify({ error: "Already friends" }), { status: 400 });

      const { data: existingReq } = await admin
        .from("friend_requests")
        .select("id")
        .eq("sender_id", me.id)
        .eq("receiver_id", target.id)
        .eq("status", "pending")
        .single();
      if (existingReq) return new Response(JSON.stringify({ status: "pending" }), { status: 200 });

      await admin.from("friend_requests").insert([{
        sender_id: me.id,
        receiver_id: target.id,
        status: "pending",
      }]);
      return new Response(JSON.stringify({ status: "pending" }), { status: 201 });
    }

    if (action === "accept" || action === "decline") {
      const { data: req } = await admin
        .from("friend_requests")
        .select("*")
        .eq("id", request_id)
        .eq("receiver_id", me.id)
        .eq("status", "pending")
        .single();
      if (!req) return new Response(JSON.stringify({ error: "Request not found" }), { status: 404 });

      if (action === "accept") {
        await admin.from("friend_requests").update({ status: "accepted" }).eq("id", request_id);
        const [a, b] = [req.sender_id, req.receiver_id].sort();
        await admin.from("friends").insert([{ user_a: a, user_b: b }]);
        return new Response(JSON.stringify({ status: "friends" }), { status: 200 });
      } else {
        await admin.from("friend_requests").update({ status: "declined" }).eq("id", request_id);
        return new Response(JSON.stringify({ status: "declined" }), { status: 200 });
      }
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

// GET: list friend requests or status with a specific user
export async function GET(request) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

    const { searchParams } = new URL(request.url);
    const statusWith = searchParams.get("with"); // username

    const { data: me } = await admin.from("clients").select("id").eq("auth_id", user.id).single();
    if (!me) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });

    if (statusWith) {
      const { data: target } = await admin.from("clients").select("id").eq("username", statusWith).single();
      if (!target) return new Response(JSON.stringify({ status: "none" }), { status: 200 });

      const { data: friends } = await admin
        .from("friends")
        .select("id")
        .or(`and(user_a.eq.${me.id},user_b.eq.${target.id}),and(user_a.eq.${target.id},user_b.eq.${me.id})`)
        .single();
      if (friends) return new Response(JSON.stringify({ status: "friends" }), { status: 200 });

      const { data: req } = await admin
        .from("friend_requests")
        .select("id, sender_id, receiver_id, status")
        .or(`and(sender_id.eq.${me.id},receiver_id.eq.${target.id}),and(sender_id.eq.${target.id},receiver_id.eq.${me.id})`)
        .eq("status", "pending")
        .single();

      if (req) {
        const direction = req.sender_id === me.id ? "sent" : "received";
        return new Response(JSON.stringify({ status: "pending", direction, request_id: req.id }), { status: 200 });
      }

      return new Response(JSON.stringify({ status: "none" }), { status: 200 });
    }

    // List incoming pending requests
    const { data: incoming } = await admin
      .from("friend_requests")
      .select("id, created_at, clients:sender_id (username, display_name, profile_pic)")
      .eq("receiver_id", me.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    return new Response(JSON.stringify(incoming || []), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
