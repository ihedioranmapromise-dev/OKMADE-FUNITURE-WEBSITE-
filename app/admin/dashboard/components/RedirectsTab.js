"use client";
import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-client";

export default function RedirectsTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ from_path: "", to_path: "", permanent: false });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const res = await adminFetch("/api/admin/redirects");
    if (res.ok) setItems(await res.json());
    setLoading(false);
  }

  const add = async () => {
    if (!form.from_path.trim() || !form.to_path.trim()) return;
    setBusy(true);
    setMessage("");
    const res = await adminFetch("/api/admin/redirects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setBusy(false);
    if (res.ok) {
      setForm({ from_path: "", to_path: "", permanent: false });
      setMessage("Redirect added.");
      load();
    } else {
      setMessage("Error: " + (data.error || "Failed"));
    }
  };

  const toggleActive = async (item) => {
    await adminFetch("/api/admin/redirects", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, active: !item.active }),
    });
    load();
  };

  const remove = async (id) => {
    if (!confirm("Delete this redirect?")) return;
    await adminFetch(`/api/admin/redirects?id=${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
        Redirects
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Send visitors from an old URL to a new one. Useful after renaming pages.
      </p>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 mb-6 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              From path
            </label>
            <input
              type="text"
              value={form.from_path}
              onChange={(e) => setForm({ ...form, from_path: e.target.value })}
              placeholder="/old-page"
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              To path
            </label>
            <input
              type="text"
              value={form.to_path}
              onChange={(e) => setForm({ ...form, to_path: e.target.value })}
              placeholder="/new-page or https://..."
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
            />
          </div>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.permanent}
            onChange={(e) => setForm({ ...form, permanent: e.target.checked })}
            className="w-4 h-4"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Permanent (301) — recommended
          </span>
        </label>
        <button
          onClick={add}
          disabled={busy || !form.from_path.trim() || !form.to_path.trim()}
          className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 rounded-lg disabled:opacity-50"
        >
          {busy ? "Adding..." : "Add Redirect"}
        </button>
        {message && (
          <p
            className={`text-sm ${
              message.startsWith("Error") ? "text-red-500" : "text-green-600 dark:text-green-400"
            }`}
          >
            {message}
          </p>
        )}
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6">
        <p className="text-xs text-amber-800 dark:text-amber-300">
          <strong>Note:</strong> These redirects live in your database. To make them work on the live site, Next.js reads them via middleware. That wiring is a small follow-up.
        </p>
      </div>

      {loading ? (
        <div className="h-40 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
      ) : items.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center text-gray-500 dark:text-gray-400">
          No redirects yet.
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">From</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">To</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Type</th>
                <th className="py-3 px-4 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-3 px-4 font-mono text-xs text-gray-700 dark:text-gray-300">
                    {r.from_path}
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-gray-700 dark:text-gray-300">
                    {r.to_path}
                  </td>
                  <td className="py-3 px-4 text-xs">
                    <span
                      className={
                        r.permanent
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-gray-500 dark:text-gray-400"
                      }
                    >
                      {r.permanent ? "301" : "302"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => toggleActive(r)}
                        className={`text-xs px-2 py-1 rounded ${
                          r.active
                            ? "bg-green-600 text-white"
                            : "bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                        }`}
                      >
                        {r.active ? "Active" : "Off"}
                      </button>
                      <button
                        onClick={() => remove(r.id)}
                        className="text-xs bg-red-500 text-white px-2 py-1 rounded"
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
      )}
    </div>
  );
}
