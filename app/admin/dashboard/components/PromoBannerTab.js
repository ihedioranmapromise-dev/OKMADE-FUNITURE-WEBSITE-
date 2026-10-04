"use client";
import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-client";

export default function PromoBannerTab() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    message: "",
    cta_text: "",
    cta_url: "",
    expires_at: "",
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const res = await adminFetch("/api/admin/promo-banner");
    if (res.ok) setBanners(await res.json());
    setLoading(false);
  }

  const add = async () => {
    if (!form.message.trim()) return;
    setBusy(true);
    const res = await adminFetch("/api/admin/promo-banner", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: form.message.trim(),
        cta_text: form.cta_text.trim() || null,
        cta_url: form.cta_url.trim() || null,
        expires_at: form.expires_at || null,
        active: true,
      }),
    });
    setBusy(false);
    if (res.ok) {
      setForm({ message: "", cta_text: "", cta_url: "", expires_at: "" });
      setMessage("Banner created.");
      load();
    } else {
      setMessage("Failed to create.");
    }
  };

  const toggleActive = async (b) => {
    await adminFetch("/api/admin/promo-banner", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: b.id, active: !b.active }),
    });
    load();
  };

  const remove = async (id) => {
    if (!confirm("Delete this banner?")) return;
    await adminFetch(`/api/admin/promo-banner?id=${id}`, { method: "DELETE" });
    load();
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="h-40 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
        Promo Banners
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Site-wide messages shown at the top of every page. Useful for sales, holidays, announcements.
      </p>

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h2 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">
          Create New Banner
        </h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Message *
            </label>
            <input
              type="text"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="🎉 Christmas sale — 20% off all showroom pieces"
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Button text (optional)
              </label>
              <input
                type="text"
                value={form.cta_text}
                onChange={(e) => setForm({ ...form, cta_text: e.target.value })}
                placeholder="Shop now"
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Button URL (optional)
              </label>
              <input
                type="text"
                value={form.cta_url}
                onChange={(e) => setForm({ ...form, cta_url: e.target.value })}
                placeholder="/showroom"
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Auto-expire (optional)
            </label>
            <input
              type="datetime-local"
              value={form.expires_at}
              onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Leave empty to keep active until manually disabled.
            </p>
          </div>
          <button
            onClick={add}
            disabled={busy || !form.message.trim()}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 rounded-lg disabled:opacity-50"
          >
            {busy ? "Creating..." : "Create Banner"}
          </button>
          {message && (
            <p className="text-sm text-green-600 dark:text-green-400">{message}</p>
          )}
        </div>
      </div>

      {banners.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">
            Existing Banners
          </h2>
          {banners.map((b) => (
            <div
              key={b.id}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex justify-between items-start gap-3 flex-wrap"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 dark:text-gray-200">{b.message}</p>
                {b.cta_text && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Button: {b.cta_text} → {b.cta_url}
                  </p>
                )}
                {b.expires_at && (
                  <p className="text-xs text-gray-400 mt-1">
                    Expires {new Date(b.expires_at).toLocaleString()}
                  </p>
                )}
                <span
                  className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full ${
                    b.active
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                      : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                  }`}
                >
                  {b.active ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => toggleActive(b)}
                  className="bg-blue-500 text-white px-3 py-1.5 rounded text-xs hover:bg-blue-600"
                >
                  {b.active ? "Disable" : "Enable"}
                </button>
                <button
                  onClick={() => remove(b.id)}
                  className="bg-red-500 text-white px-3 py-1.5 rounded text-xs hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
