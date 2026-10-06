"use client";
import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-client";

export default function ReportsTab() {
  const [tab, setTab] = useState("posts");
  const [data, setData] = useState({ post_reports: [], comment_reports: [] });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [message, setMessage] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const res = await adminFetch("/api/admin/reports");
    if (res.ok) setData(await res.json());
    setLoading(false);
  }

  const updateStatus = async (type, id, status) => {
    const res = await adminFetch("/api/admin/reports", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, id, status }),
    });
    if (res.ok) {
      setMessage(`Marked as ${status}.`);
      load();
    }
  };

  const deleteContent = async (type, id, label) => {
    if (!confirm(`Delete the reported ${label} AND the report? This cannot be undone.`)) return;
    const res = await adminFetch(`/api/admin/reports?id=${id}&type=${type}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setMessage(`Deleted.`);
      load();
    } else {
      setMessage("Delete failed.");
    }
  };

  const currentList = tab === "posts" ? data.post_reports : data.comment_reports;
  const filtered = filter === "all" ? currentList : currentList.filter((r) => r.status === filter);

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-8 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">
        Reports
      </h1>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 mb-4">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setTab("posts")}
            className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition ${
              tab === "posts"
                ? "border-amber-600 text-amber-700 dark:text-amber-400"
                : "border-transparent text-gray-500 dark:text-gray-400"
            }`}
          >
            Post Reports ({data.post_reports.length})
          </button>
          <button
            onClick={() => setTab("comments")}
            className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition ${
              tab === "comments"
                ? "border-amber-600 text-amber-700 dark:text-amber-400"
                : "border-transparent text-gray-500 dark:text-gray-400"
            }`}
          >
            Comment Reports ({data.comment_reports.length})
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {["pending", "resolved", "dismissed", "all"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
              filter === f
                ? "bg-amber-600 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {message && <p className="text-sm text-green-600 dark:text-green-400 mb-3">{message}</p>}

      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center text-gray-500 dark:text-gray-400">
          No reports matching this filter.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => {
            const isPost = tab === "posts";
            const contentPreview = isPost
              ? r.post?.content || "(no text)"
              : r.comment?.content || "(no text)";
            const authorName = isPost
              ? r.reporter?.username || "anonymous"
              : r.reporter_id ? "logged-in user" : "guest";

            return (
              <div
                key={r.id}
                className={`bg-white dark:bg-gray-900 rounded-xl border p-4 ${
                  r.status === "pending"
                    ? "border-red-200 dark:border-red-800"
                    : "border-gray-200 dark:border-gray-700"
                }`}
              >
                <div className="flex justify-between items-start gap-3 flex-wrap mb-3">
                  <div>
                    <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                      {r.reason}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Reported by @{authorName} ·{" "}
                      {new Date(r.created_at).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      r.status === "pending"
                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                        : r.status === "resolved"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {r.status}
                  </span>
                </div>

                {r.details && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-3 rounded mb-3">
                    <p className="text-xs text-amber-700 dark:text-amber-300 font-semibold mb-1">
                      Reporter's note:
                    </p>
                    <p className="text-sm text-amber-900 dark:text-amber-200 whitespace-pre-wrap">
                      {r.details}
                    </p>
                  </div>
                )}

                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Reported content:
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {contentPreview}
                  </p>
                  {isPost && r.post?.image_urls?.length > 0 && (
                    <p className="text-xs text-gray-400 mt-1">
                      + {r.post.image_urls.length} image(s)
                    </p>
                  )}
                </div>

                <div className="flex gap-2 flex-wrap">
                  {r.status === "pending" && (
                    <>
                      <button
                        onClick={() => updateStatus(tab === "posts" ? "post" : "comment", r.id, "resolved")}
                        className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded"
                      >
                        Mark resolved
                      </button>
                      <button
                        onClick={() => updateStatus(tab === "posts" ? "post" : "comment", r.id, "dismissed")}
                        className="text-xs bg-gray-500 hover:bg-gray-600 text-white px-3 py-1.5 rounded"
                      >
                        Dismiss
                      </button>
                    </>
                  )}
                  <button
                    onClick={() =>
                      deleteContent(
                        tab === "posts" ? "post" : "comment",
                        r.id,
                        isPost ? "post" : "comment"
                      )
                    }
                    className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded"
                  >
                    Delete content
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
