"use client";
import { useEffect, useState } from "react";

export default function DeleteRequestsTab() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [message, setMessage] = useState("");

  const key = () => sessionStorage.getItem("adminKey") || "";

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/delete-requests", {
      headers: { "x-admin-key": key() },
    });
    if (res.ok) setRequests(await res.json());
    setLoading(false);
  }

  const updateStatus = async (id, status) => {
    const res = await fetch("/api/admin/delete-requests", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": key(),
      },
      body: JSON.stringify({ id, status }),
    });
    if (res.ok) {
      setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
      setMessage(`Marked as ${status}.`);
    }
  };

  const filtered =
    filter === "all" ? requests : requests.filter((r) => r.status === filter);

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          Account Deletion Requests
        </h1>
        <div className="flex gap-2">
          {["pending", "processed", "all"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                filter === f
                  ? "bg-amber-600 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {message && <p className="text-sm text-green-600 dark:text-green-400 mb-3">{message}</p>}

      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center text-gray-500 dark:text-gray-400">
          No {filter} requests.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <div
              key={r.id}
              className={`bg-white dark:bg-gray-900 rounded-xl border p-5 ${
                r.status === "pending"
                  ? "border-red-200 dark:border-red-800"
                  : "border-gray-200 dark:border-gray-700"
              }`}
            >
              <div className="flex justify-between items-start gap-3 flex-wrap mb-3">
                <div>
                  <p className="font-semibold text-gray-800 dark:text-gray-100">
                    {r.display_name || r.username}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    @{r.username} · {r.email || "no email"} · {r.phone || "no phone"}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Requested {new Date(r.created_at).toLocaleString()}
                  </p>
                </div>
                <span
                  className={`text-xs px-3 py-1 rounded-full font-medium ${
                    r.status === "pending"
                      ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                      : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                  }`}
                >
                  {r.status}
                </span>
              </div>

              {r.reason && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-3 rounded mb-3">
                  <p className="text-xs text-amber-700 dark:text-amber-300 font-semibold mb-1">
                    Reason:
                  </p>
                  <p className="text-sm text-amber-900 dark:text-amber-200 whitespace-pre-wrap">
                    {r.reason}
                  </p>
                </div>
              )}

              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-3">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  <strong>To complete deletion:</strong> open Supabase Dashboard →
                  Authentication → Users → delete the user. Then delete their row in
                  the <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">clients</code> table.
                </p>
                {r.auth_id && (
                  <p className="text-xs font-mono text-gray-500 dark:text-gray-500 mt-1">
                    Auth ID: {r.auth_id}
                  </p>
                )}
              </div>

              <div className="flex gap-2 flex-wrap">
                <a
                  href={`/client/${r.username}`}
                  target="_blank"
                  className="bg-blue-500 text-white px-3 py-1.5 rounded text-xs hover:bg-blue-600"
                >
                  View Profile
                </a>
                {r.status === "pending" ? (
                  <button
                    onClick={() => updateStatus(r.id, "processed")}
                    className="bg-green-600 text-white px-3 py-1.5 rounded text-xs hover:bg-green-700"
                  >
                    Mark as Processed
                  </button>
                ) : (
                  <button
                    onClick={() => updateStatus(r.id, "pending")}
                    className="bg-gray-500 text-white px-3 py-1.5 rounded text-xs hover:bg-gray-600"
                  >
                    Reopen
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
