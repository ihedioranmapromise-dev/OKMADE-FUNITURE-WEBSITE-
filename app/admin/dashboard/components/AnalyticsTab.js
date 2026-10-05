"use client";
import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-client";

export default function AnalyticsTab() {
  const [days, setDays] = useState(7);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, [days]);

  async function load() {
    setLoading(true);
    const res = await adminFetch(`/api/admin/analytics?days=${days}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return <div className="text-red-500">Failed to load analytics.</div>;

  const maxTimeline = Math.max(...data.timeline.map((t) => t.count), 1);

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          Analytics
        </h1>
        <div className="flex gap-1">
          {[1, 7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg ${
                days === d
                  ? "bg-amber-600 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs uppercase text-gray-400 font-semibold">Total Visits</p>
          <p className="text-3xl font-bold text-gray-800 dark:text-gray-100 mt-1">
            {data.totalVisits}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs uppercase text-gray-400 font-semibold">Unique Visitors</p>
          <p className="text-3xl font-bold text-gray-800 dark:text-gray-100 mt-1">
            {data.uniqueVisitors}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs uppercase text-gray-400 font-semibold">Searches</p>
          <p className="text-3xl font-bold text-gray-800 dark:text-gray-100 mt-1">
            {data.totalSearches}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs uppercase text-gray-400 font-semibold">Top Page</p>
          <p className="text-sm font-bold text-gray-800 dark:text-gray-100 mt-2 truncate">
            {data.topPaths[0]?.path || "—"}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 mb-6">
        <h2 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">
          Visits per day
        </h2>
        {data.timeline.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No data yet.</p>
        ) : (
          <div className="flex items-end gap-1 h-32">
            {data.timeline.map((t) => (
              <div key={t.day} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-amber-500 rounded-t"
                  style={{ height: `${(t.count / maxTimeline) * 100}%`, minHeight: 4 }}
                  title={`${t.day}: ${t.count} visits`}
                />
                <span className="text-[9px] text-gray-400 rotate-45 origin-left mt-2">
                  {t.day.slice(5)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">
            Top pages
          </h2>
          {data.topPaths.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">No data.</p>
          ) : (
            <div className="space-y-2">
              {data.topPaths.map((p) => (
                <div key={p.path} className="flex justify-between items-center text-sm">
                  <span className="truncate mr-2 text-gray-700 dark:text-gray-300">
                    {p.path}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400 flex-shrink-0">
                    {p.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">
            Traffic sources
          </h2>
          {data.topReferrers.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">No data.</p>
          ) : (
            <div className="space-y-2">
              {data.topReferrers.map((r) => (
                <div key={r.source} className="flex justify-between items-center text-sm">
                  <span className="truncate mr-2 text-gray-700 dark:text-gray-300">
                    {r.source}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400 flex-shrink-0">
                    {r.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">
            Top searches
          </h2>
          {data.topSearches.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">No data.</p>
          ) : (
            <div className="space-y-2">
              {data.topSearches.map((s) => (
                <div key={s.query} className="flex justify-between items-center text-sm">
                  <span className="truncate mr-2 text-gray-700 dark:text-gray-300">
                    {s.query}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400 flex-shrink-0">
                    {s.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
