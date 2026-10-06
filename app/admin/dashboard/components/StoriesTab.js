"use client";
import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-client";

export default function StoriesTab() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [message, setMessage] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const res = await adminFetch("/api/admin/stories");
    if (res.ok) setStories(await res.json());
    setLoading(false);
  }

  const toggleFlag = async (story) => {
    const res = await adminFetch("/api/admin/stories", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: story.id, flagged: !story.flagged }),
    });
    if (res.ok) {
      setStories((prev) =>
        prev.map((s) => (s.id === story.id ? { ...s, flagged: !s.flagged } : s))
      );
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete this story? It will disappear from the feed.")) return;
    const res = await adminFetch(`/api/admin/stories?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setStories((prev) => prev.filter((s) => s.id !== id));
      setMessage("Story deleted.");
    } else {
      setMessage("Delete failed.");
    }
  };

  const now = Date.now();
  const filtered = stories.filter((s) => {
    const ageH = (now - new Date(s.created_at).getTime()) / 3600000;
    if (filter === "recent") return ageH < 24;
    if (filter === "expired") return ageH >= 24;
    if (filter === "flagged") return s.flagged;
    return true;
  });

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-8 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="aspect-square bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
        Stories
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Stories auto-expire after 24 hours. Flag or delete them manually here.
      </p>

      <div className="flex gap-2 mb-4 flex-wrap">
        {["all", "recent", "expired", "flagged"].map((f) => (
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
          No stories in this filter.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((s) => {
            const ageH = (now - new Date(s.created_at).getTime()) / 3600000;
            const expired = ageH >= 24;
            return (
              <div
                key={s.id}
                className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                <div className="relative aspect-square bg-gray-100 dark:bg-gray-800">
                  <img
                    src={s.image_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  {expired && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="text-white text-xs font-bold bg-black/70 px-2 py-1 rounded">
                        EXPIRED
                      </span>
                    </div>
                  )}
                  {s.flagged && (
                    <div className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full font-bold">
                      FLAGGED
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <a
                    href={`/client/${s.clients?.username}`}
                    target="_blank"
                    className="text-xs font-semibold text-gray-800 dark:text-gray-200 hover:underline block truncate"
                  >
                    @{s.clients?.username || "unknown"}
                  </a>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {new Date(s.created_at).toLocaleString()}
                  </p>
                  <div className="flex gap-1 mt-3">
                    <button
                      onClick={() => toggleFlag(s)}
                      className={`flex-1 text-xs px-2 py-1.5 rounded ${
                        s.flagged
                          ? "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                          : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
                      }`}
                    >
                      {s.flagged ? "Unflag" : "Flag"}
                    </button>
                    <button
                      onClick={() => remove(s.id)}
                      className="flex-1 text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1.5 rounded"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
