"use client";
import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-client";

export default function ReferralsTab() {
  const [data, setData] = useState({ total: 0, byReferrer: [], all: [] });
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("top");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const res = await adminFetch("/api/admin/referrals");
    if (res.ok) setData(await res.json());
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            Referrals
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {data.total} total signups via referral codes
          </p>
        </div>
        <div className="flex gap-1">
          {[
            { id: "top", label: "Top Referrers" },
            { id: "all", label: "All Signups" },
          ].map((v) => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg ${
                view === v.id
                  ? "bg-amber-600 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {view === "top" && (
        <>
          {data.byReferrer.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center text-gray-500 dark:text-gray-400">
              No referrals yet.
            </div>
          ) : (
            <div className="space-y-3">
              {data.byReferrer.map((r, idx) => (
                <div
                  key={r.referrer?.id || idx}
                  className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4"
                >
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold text-sm">
                        {idx + 1}
                      </div>
                      <div>
                        <a
                          href={`/client/${r.referrer?.username}`}
                          target="_blank"
                          className="font-semibold text-gray-800 dark:text-gray-200 hover:underline"
                        >
                          {r.referrer?.display_name || r.referrer?.username}
                        </a>
                        <p className="text-xs text-gray-400">
                          @{r.referrer?.username}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                      {r.count} referral{r.count > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {r.referred.slice(0, 8).map((u, i) => (
                      <a
                        key={i}
                        href={`/client/${u.username}`}
                        target="_blank"
                        className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                      >
                        @{u.username}
                      </a>
                    ))}
                    {r.referred.length > 8 && (
                      <span className="text-xs text-gray-400 px-2 py-1">
                        +{r.referred.length - 8} more
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {view === "all" && (
        <>
          {data.all.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center text-gray-500 dark:text-gray-400">
              No referrals yet.
            </div>
          ) : (
            <div className="overflow-x-auto bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
              <table className="min-w-full">
                <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                      Code
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                      Referrer
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                      New User
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.all.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-gray-100 dark:border-gray-800"
                    >
                      <td className="py-3 px-4 font-mono text-xs text-amber-600 dark:text-amber-400">
                        {r.code}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">
                        @{r.referrer?.username}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">
                        @{r.referred?.username}
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-500 dark:text-gray-400">
                        {new Date(r.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
