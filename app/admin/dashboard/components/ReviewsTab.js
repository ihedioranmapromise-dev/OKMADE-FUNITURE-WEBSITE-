"use client";
import { useEffect, useState, useMemo } from "react";

const PAGE_SIZE = 15;

export default function ReviewsTab() {
  const [reviews, setReviews] = useState([]);
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
    const res = await fetch("/api/admin/reviews", { headers: { "x-admin-key": key() } });
    if (res.ok) setReviews(await res.json());
    setLoading(false);
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return reviews;
    const q = search.toLowerCase();
    return reviews.filter((r) =>
      (r.user_name || "").toLowerCase().includes(q) ||
      (r.comment || "").toLowerCase().includes(q) ||
      (r.showroom?.description || "").toLowerCase().includes(q)
    );
  }, [reviews, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const remove = async (id) => {
    if (!confirm("Delete this review?")) return;
    const res = await fetch(`/api/admin/reviews?id=${id}`, {
      method: "DELETE",
      headers: { "x-admin-key": key() },
    });
    if (res.ok) {
      setReviews((prev) => prev.filter((r) => r.id !== id));
      setMessage("Review deleted.");
    } else {
      setMessage("Delete failed.");
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-14 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          Product Reviews
        </h1>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {reviews.length} total
        </span>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name, comment or product..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full md:max-w-md p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-amber-500"
        />
      </div>

      {message && <p className="text-sm text-green-600 dark:text-green-400 mb-3">{message}</p>}

      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center text-gray-500 dark:text-gray-400">
          {search ? "No reviews match." : "No reviews yet."}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <table className="min-w-full">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Author</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Rating</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Comment</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Product</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Date</th>
                  <th className="py-3 px-4 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="py-3 px-4 text-sm text-gray-800 dark:text-gray-200">
                      {r.user_name}
                    </td>
                    <td className="py-3 px-4 text-sm text-amber-500">
                      {"★".repeat(r.rating)}
                      <span className="text-gray-300 dark:text-gray-600">
                        {"★".repeat(5 - r.rating)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                      {r.comment || "—"}
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-500 dark:text-gray-400 max-w-[180px] truncate">
                      {r.showroom?.description || "—"}
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-500 dark:text-gray-400">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex gap-2 justify-end">
                        {r.showroom?.id && (
                          <a
                            href={`/product/${r.showroom.id}`}
                            target="_blank"
                            className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600"
                          >
                            View
                          </a>
                        )}
                        <button
                          onClick={() => remove(r.id)}
                          className="bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
