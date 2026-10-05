"use client";
import { useEffect, useState, useMemo } from "react";
import { adminFetch } from "@/lib/admin-client";

const PAGE_SIZE = 20;

export default function PostsTab() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const res = await adminFetch("/api/admin/posts");
    if (res.ok) setPosts(await res.json());
    setLoading(false);
  }

  const filtered = useMemo(() => {
    if (filter === "all") return posts;
    return posts.filter((p) => p.status === filter);
  }, [posts, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const publishNow = async (id) => {
    const res = await adminFetch("/api/admin/posts", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "published", scheduled_for: null }),
    });
    if (res.ok) {
      setMessage("Post published.");
      load();
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete this post?")) return;
    const res = await adminFetch(`/api/admin/posts?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setMessage("Post deleted.");
      load();
    }
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
          Feed Posts
        </h1>
        <div className="flex gap-1">
          {[
            { id: "all", label: "All" },
            { id: "published", label: "Published" },
            { id: "draft", label: "Drafts" },
            { id: "scheduled", label: "Scheduled" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => {
                setFilter(f.id);
                setPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg ${
                filter === f.id
                  ? "bg-amber-600 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {message && (
        <p className="text-sm text-green-600 dark:text-green-400 mb-3">{message}</p>
      )}

      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center text-gray-500 dark:text-gray-400">
          No posts in this filter.
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {paginated.map((p) => (
              <div
                key={p.id}
                className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4"
              >
                <div className="flex justify-between items-start gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                        {p.clients?.display_name || p.clients?.username || "Unknown"}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          p.status === "draft"
                            ? "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                            : p.status === "scheduled"
                            ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                            : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                        }`}
                      >
                        {p.status || "published"}
                      </span>
                      {p.is_auto && (
                        <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full">
                          AUTO
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap line-clamp-3">
                      {p.content}
                    </p>
                    {p.image_urls?.length > 0 && (
                      <p className="text-xs text-gray-400 mt-1">
                        {p.image_urls.length} image{p.image_urls.length > 1 ? "s" : ""}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      {p.scheduled_for && `Scheduled: ${new Date(p.scheduled_for).toLocaleString()} · `}
                      Created: {new Date(p.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0 flex-wrap">
                    {p.status === "scheduled" && (
                      <button
                        onClick={() => publishNow(p.id)}
                        className="text-xs bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700"
                      >
                        Publish now
                      </button>
                    )}
                    <button
                      onClick={() => remove(p.id)}
                      className="text-xs bg-red-500 text-white px-3 py-1.5 rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 disabled:opacity-40"
              >
                ← Prev
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
