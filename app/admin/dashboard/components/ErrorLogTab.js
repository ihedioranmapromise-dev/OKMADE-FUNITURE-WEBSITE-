"use client";
import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-client";

export default function ErrorLogTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const res = await adminFetch("/api/admin/error-log");
    if (res.ok) setItems(await res.json());
    setLoading(false);
  }

  const remove = async (id) => {
    if (!confirm("Delete this entry?")) return;
    await adminFetch(`/api/admin/error-log?id=${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((x) => x.id !== id));
  };

  const clearAll = async () => {
    if (!confirm("Delete ALL error log entries? This cannot be undone.")) return;
    await adminFetch(`/api/admin/error-log?id=all`, { method: "DELETE" });
    setItems([]);
  };

  const filtered = search.trim()
    ? items.filter(
        (i) =>
          (i.message || "").toLowerCase().includes(search.toLowerCase()) ||
          (i.path || "").toLowerCase().includes(search.toLowerCase())
      )
    : items;

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          Error Log
        </h1>
        {items.length > 0 && (
          <button
            onClick={clearAll}
            className="text-sm text-red-600 dark:text-red-400 hover:underline"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search errors..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:max-w-md p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center text-gray-500 dark:text-gray-400">
          {search ? "No errors match." : "No errors logged. Everything is running smoothly."}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((e) => (
            <div
              key={e.id}
              className="bg-white dark:bg-gray-900 rounded-xl border border-red-200 dark:border-red-800 overflow-hidden"
            >
              <button
                onClick={() => setExpanded(expanded === e.id ? null : e.id)}
                className="w-full text-left p-4 hover:bg-red-50 dark:hover:bg-red-900/10 transition"
              >
                <div className="flex justify-between items-start gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 line-clamp-2">
                      {e.message}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {e.method} {e.path} · {new Date(e.created_at).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={(ev) => {
                      ev.stopPropagation();
                      remove(e.id);
                    }}
                    className="text-xs text-red-600 dark:text-red-400 hover:underline flex-shrink-0"
                  >
                    Delete
                  </button>
                </div>
              </button>
              {expanded === e.id && (
                <div className="border-t border-red-200 dark:border-red-800 p-4 bg-red-50 dark:bg-red-900/10">
                  {e.stack && (
                    <>
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Stack trace
                      </p>
                      <pre className="text-xs text-gray-700 dark:text-gray-300 overflow-auto bg-white dark:bg-gray-900 p-3 rounded border border-gray-200 dark:border-gray-700 mb-3">
                        {e.stack}
                      </pre>
                    </>
                  )}
                  {e.ip && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      IP: {e.ip}
                    </p>
                  )}
                  {e.user_agent && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 break-words">
                      UA: {e.user_agent}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
