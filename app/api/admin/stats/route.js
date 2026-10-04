import { createClient } from "@supabase/supabase-js";
import { isAdmin, unauthorized, serverError } from "@/lib/admin-guard";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  if (!(await isAdmin(request))) return unauthorized();
  try {
    const [users, projects, killed, products, catalogs, reviews, pending, recentUsers] =
      await Promise.all([
        admin.from("clients").select("*", { count: "exact", head: true }),
        admin.from("projects").select("*", { count: "exact", head: true }).eq("status", "active"),
        admin.from("projects").select("*", { count: "exact", head: true }).eq("status", "killed"),
        admin.from("showroom").select("*", { count: "exact", head: true }),
        admin.from("catalogs").select("*", { count: "exact", head: true }),
        admin.from("ratings").select("*", { count: "exact", head: true }),
        admin.from("delete_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
        admin.from("clients").select("id, username, display_name, profile_pic, created_at").order("created_at", { ascending: false }).limit(5),
      ]);

    return new Response(JSON.stringify({
      users: users.count || 0,
      activeProjects: projects.count || 0,
      killedProjects: killed.count || 0,
      products: products.count || 0,
      catalogs: catalogs.count || 0,
      reviews: reviews.count || 0,
      pendingDeletes: pending.count || 0,
      recentUsers: recentUsers.data || [],
    }), { status: 200 });
  } catch (err) {
    return serverError(err.message);
  }
}
