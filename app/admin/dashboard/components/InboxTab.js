"use client";
import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-client";

export default function InboxTab() {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const res = await adminFetch("/api/admin/inbox");
    if (res.ok) {
      const d = await res.json();
      setItems(d.items || []);
      setUnread(d.unread || 0);
    }
    setLoading(false);
  }

  const markRead = async (id) => {
    await adminFetch("/api/admin/inbox", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, is_read: true } : x)));
    setUnread((u) => Math.max(0, u - 1));
  };

  const markAll = async () => {
    await adminFetch("/api/admin/inbox", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mark_all: true }),
    });
    setItems((prev) => prev.map((x) => ({ ...x, is_read: true })));
    setUnread(0);
  };

  const remove = async (id) => {
    if (!confirm("Delete this item?")) return;
    await adminFetch(`/api/admin/inbox?id=${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((x) => x.id !== id));
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-8 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          Inbox
          {unread > 0 && (
            <span className="ml-2 text-sm bg-red-600 text-white px-2 py-1 rounded-full">
              {unread}
            </span>
          )}
        </h1>
        {unread > 0 && (
          <button
            onClick={markAll}
            className="text-sm text-amber-600 dark:text-amber-400 hover:underline"
          >
            Mark all as read
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center text-gray-500 dark:text-gray-400">
          No inbox items yet.
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className={`rounded-xl border p-4 flex items-start gap-3 ${
                item.is_read
                  ? "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                  : "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                  item.is_read ? "bg-gray-300 dark:bg-gray-700" : "bg-amber-500"
                }`}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  {item.title || item.type}
                </p>
                {item.body && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {item.body}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(item.created_at).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                {!item.is_read && (
                  <button
                    onClick={() => markRead(item.id)}
                    className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    Mark read
                  </button>
                )}
                <button
                  onClick={() => remove(item.id)}
                  className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
