"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function NotificationsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/notifications").then((r) => {
      if (r.status === 401) { router.push("/client/login"); return []; }
      return r.json();
    }).then((data) => {
      setItems(Array.isArray(data) ? data : []);
      setLoading(false);
    });
  }, []);

  const markAll = async () => {
    await fetch("/api/notifications", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mark_all: true }),
    });
    setItems(items.map((n) => ({ ...n, is_read: true })));
  };

  const handleClick = async (n) => {
    await fetch("/api/notifications", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: n.id }),
    });
    setItems(items.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
    if (n.target_url) router.push(n.target_url);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-amber-600">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
          {items.some((n) => !n.is_read) && (
            <button onClick={markAll} className="text-sm text-amber-600 hover:underline">
              Mark all as read
            </button>
          )}
        </div>
        {items.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
            No notifications yet.
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((n) => (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={`w-full text-left p-4 rounded-xl border transition ${
                  !n.is_read ? "bg-amber-50 border-amber-200" : "bg-white border-gray-200 hover:bg-gray-50"
                }`}
              >
                <p className="text-sm text-gray-800">{n.message}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleString()}</p>
              </button>
            ))}
          </div>
        )}
        <a href="/client/dashboard" className="inline-block mt-6 text-sm text-amber-600 hover:underline">
          ← Back to Dashboard
        </a>
      </div>
    </div>
  );
}
