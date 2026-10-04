"use client";
import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-client";

export default function OverviewTab() {
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, actRes] = await Promise.all([
          adminFetch("/api/admin/stats"),
          adminFetch("/api/admin/activity"),
        ]);
        if (statsRes.ok) setStats(await statsRes.json());
        if (actRes.ok) {
          const acts = await actRes.json();
          setActivity(acts.slice(0, 8));
        }
      } catch {}
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div>
        <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12 text-red-600 dark:text-red-400">
        Failed to load stats. Try refreshing.
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Overview</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
        <StatCard label="Registered Users" value={stats.users} color="blue" />
        <StatCard label="Active Projects" value={stats.activeProjects} color="amber" />
        <StatCard label="Completed Projects" value={stats.killedProjects} color="green" />
        <StatCard label="Showroom Products" value={stats.products} color="purple" />
        <StatCard label="Catalog Spaces" value={stats.catalogs} color="gray" />
        <StatCard label="Product Reviews" value={stats.reviews} color="pink" />
      </div>

      {stats.pendingDeletes > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-8">
          <p className="text-sm text-red-800 dark:text-red-300">
            <strong>{stats.pendingDeletes}</strong> pending account deletion request{stats.pendingDeletes > 1 ? "s" : ""}.{" "}
            <a href="?tab=delete-requests" className="underline font-semibold">
              Review now →
            </a>
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">Recent Users</h2>
          {stats.recentUsers.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">No users yet.</p>
          ) : (
            <div className="space-y-3">
              {stats.recentUsers.map((u) => (
                <div key={u.id} className="flex items-center gap-3">
                  {u.profile_pic ? (
                    <img src={u.profile_pic} className="w-9 h-9 rounded-full object-cover" alt="" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold text-sm">
                      {(u.display_name || u.username || "?").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                      {u.display_name || u.username}
                    </p>
                    <p className="text-xs text-gray-400">@{u.username}</p>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(u.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">Recent Activity</h2>
          {activity.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">No activity yet.</p>
          ) : (
            <div className="space-y-3">
              {activity.map((a) => (
                <div key={a.id} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {humanAction(a.action)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(a.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color = "gray" }) {
  const colorMap = {
    gray: "from-gray-600 to-gray-800",
    blue: "from-blue-500 to-blue-700",
    green: "from-green-500 to-green-700",
    purple: "from-purple-500 to-purple-700",
    amber: "from-amber-500 to-amber-700",
    pink: "from-pink-500 to-pink-700",
  };
  return (
    <div className={`bg-gradient-to-br ${colorMap[color]} text-white rounded-xl p-6 shadow-md`}>
      <p className="text-sm opacity-80">{label}</p>
      <p className="text-4xl font-bold mt-2">{value}</p>
    </div>
  );
}

function humanAction(a) {
  const map = {
    admin_login: "Admin logged in",
    admin_password_changed: "Admin password changed",
    category_created: "Category created",
    category_updated: "Category updated",
    category_deleted: "Category deleted",
    product_created: "Product added",
    product_updated: "Product updated",
    product_deleted: "Product deleted",
    project_created: "Project created",
    project_updated: "Project updated",
    project_deleted: "Project deleted",
    catalog_created: "Catalog added",
    catalog_updated: "Catalog updated",
    catalog_deleted: "Catalog deleted",
    progress_uploaded: "Progress images uploaded",
    timeline_updated: "Project timeline updated",
    user_updated: "User updated",
    review_deleted: "Review deleted",
    comment_deleted: "Comment deleted",
    backup_created: "Backup created",
    test_email_sent: "Test email sent",
    notification_sent: "Notification sent",
    ip_blocked: "IP blocked",
    ip_unblocked: "IP unblocked",
    featured_toggled: "Featured product toggled",
    content_updated: "Site content updated",
    seo_updated: "SEO updated",
    promo_banner_created: "Promo banner created",
    promo_banner_updated: "Promo banner updated",
    promo_banner_deleted: "Promo banner deleted",
    social_links_updated: "Social links updated",
    maintenance_toggled: "Maintenance mode toggled",
    delete_request_updated: "Delete request updated",
  };
  return map[a] || a;
}
