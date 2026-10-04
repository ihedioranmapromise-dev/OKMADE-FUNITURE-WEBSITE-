"use client";
import { useEffect, useState, useMemo } from "react";

const PAGE_SIZE = 20;

export default function CommentsTab() {
  const [tab, setTab] = useState("posts");
  const [data, setData] = useState({ post_comments: [], public_comments: [] });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState("");

  const key = () => sessionStorage.getItem("adminKey") || "";

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/comments", {
      headers: { "x-admin-key": key() },
    });
    if (res.ok) setData(await res.json());
    setLoading(false);
  }

  const currentList = tab === "posts" ? data.post_comments : data.public_comments;

  const filtered = useMemo(() => {
    if (!search.trim()) return currentList;
    const q = search.toLowerCase();
    return currentList.filter(
      (c) =>
        (c.author_name || "").toLowerCase().includes(q) ||
        (c.content || c.message || "").toLowerCase().includes(q)
    );
  }, [currentList, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const remove = async (id) => {
    if (!confirm("Delete this comment?")) return;
    const type = tab === "posts" ? "post" : "public";
    const res = await fetch(`/api/admin/comments?id=${id}&type=${type}`, {
      method: "DELETE",
      headers: { "x-admin-key": key() },
    });
    if (res.ok) {
      const field = tab === "posts" ? "post_comments" : "public_comments";
      setData((prev) => ({
        ...prev,
        [field]: prev[field].filter((c) => c.id !== id),
      }));
      setMessage("Comment deleted.");
    } else {
      setMessage("Delete failed.");
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="h-14 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">
        Comments Moderation
      </h1>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 mb-4">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => {
              setTab("posts");
              setPage(1);
            }}
            className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition ${
              tab === "posts"
                ? "border-amber-600 text-amber-700 dark:text-amber-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            Feed Comments ({data.post_comments.length})
          </button>
          <button
            onClick={() => {
              setTab("public");
              setPage(1);
            }}
            className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition ${
              tab === "public"
                ? "border-amber-600 text-amber-700 dark:text-amber-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            Project Comments ({data.public_comments.length})
          </button>
        </div>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search comments..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full md:max-w-md p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-amber-500"
        />
      </div>

      {message && (
        <p className="text-sm text-green-600 dark:text-green-400 mb-3">{message}</p>
      )}

      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center text-gray-500 dark:text-gray-400">
          {search ? "No comments match." : "No comments yet."}
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {paginated.map((c) => (
              <div
                key={c.id}
                className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4"
              >
                <div className="flex justify-between items-start gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                        {c.author_name}
                      </span>
                      {c.is_guest !== undefined && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            c.is_guest
                              ? "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                              : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                          }`}
                        >
                          {c.is_guest ? "GUEST" : "ARTISAN"}
                        </span>
                      )}
                      <span className="text-xs text-gray-400">
                        {new Date(c.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {c.content || c.message}
                    </p>
                    {c.posts && (
                      <p className="text-xs text-gray-400 mt-1 truncate">
                        On post: {c.posts.content?.slice(0, 60) || "—"}
                      </p>
                    )}
                    {c.projects && (
                      <p className="text-xs text-gray-400 mt-1 truncate">
                        On project: {c.projects.work_description || "—"}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => remove(c.id)}
                    className="bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600 flex-shrink-0"
                  >
                    Delete
                  </button>
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
