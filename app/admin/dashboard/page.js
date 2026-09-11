"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function AdminDashboard() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const auth = sessionStorage.getItem("adminAuth");
    if (auth !== "true") router.push("/admin/login");
    else fetchNotifications();
  }, []);

  async function fetchNotifications() {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.is_read).length);
    }
  }

  const markAllAsRead = async () => {
    await supabase.from("notifications").update({ is_read: true }).neq("is_read", true);
    setUnreadCount(0);
    fetchNotifications();
  };

  const handleNotificationClick = (notification) => {
    supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notification.id)
      .then(() => fetchNotifications());
    if (notification.target_url) {
      router.push(notification.target_url);
    } else {
      router.push("/admin/progress");
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="relative bg-white p-2 rounded-full shadow hover:shadow-md transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-10 max-h-96 overflow-y-auto">
              <div className="p-3 border-b flex justify-between items-center">
                <span className="font-semibold">Notifications</span>
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} className="text-xs text-blue-600 hover:underline">
                    Mark all read
                  </button>
                )}
              </div>
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">No notifications.</div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`p-3 border-b hover:bg-gray-50 cursor-pointer transition ${!n.is_read ? "bg-amber-50" : ""}`}
                  >
                    <p className="text-sm">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(n.created_at).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <a href="/admin/projects" className="bg-yellow-600 hover:bg-yellow-700 text-white p-6 rounded-xl text-center shadow-lg transition">
          Generate Project (Token or Standalone)
        </a>
        <a href="/admin/progress" className="bg-blue-600 hover:bg-blue-700 text-white p-6 rounded-xl text-center shadow-lg transition">
          Upload Progress & Manage Projects
        </a>
        <a href="/admin/showroom" className="bg-green-600 hover:bg-green-700 text-white p-6 rounded-xl text-center shadow-lg transition">
          Add Product to Showroom
        </a>
        <a href="/admin/products" className="bg-indigo-600 hover:bg-indigo-700 text-white p-6 rounded-xl text-center shadow-lg transition">
          Manage Products
        </a>
        <a href="/admin/catalog" className="bg-purple-600 hover:bg-purple-700 text-white p-6 rounded-xl text-center shadow-lg transition">
          Add Catalog Space
        </a>
        <a href="/admin/catalogs" className="bg-pink-600 hover:bg-pink-700 text-white p-6 rounded-xl text-center shadow-lg transition">
          Manage Catalogs
        </a>
        <a href="/admin/testimonials" className="bg-red-600 hover:bg-red-700 text-white p-6 rounded-xl text-center shadow-lg transition">
          Manage Portfolio
        </a>
      </div>

      <div className="mt-12 bg-white p-6 rounded-xl shadow-md">
        <h2 className="font-bold text-xl mb-4">Quick Info</h2>
        <ul className="list-disc pl-6 space-y-2 text-gray-700">
          <li>Use "Generate Project" to create both client projects (with tokens) and standalone portfolio projects.</li>
          <li>Use "Upload Progress" to update active projects and mark them as complete.</li>
          <li>Completed projects automatically appear on the public Portfolio page.</li>
          <li>Client projects also appear on the Testimonials page (with client names).</li>
        </ul>
      </div>
    </div>
  );
}