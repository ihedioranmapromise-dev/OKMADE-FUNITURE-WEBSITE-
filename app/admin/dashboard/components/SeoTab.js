"use client";
import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-client";

const PAGES = [
  { id: "home", label: "Homepage" },
  { id: "portfolio", label: "Portfolio" },
  { id: "showroom", label: "Showroom" },
  { id: "catalog", label: "Catalog" },
  { id: "workers", label: "Artisans" },
];

export default function SeoTab() {
  const [page, setPage] = useState("home");
  const [form, setForm] = useState({ title: "", description: "", og_image: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    load();
  }, [page]);

  async function load() {
    setLoading(true);
    const res = await adminFetch("/api/admin/seo");
    if (res.ok) {
      const all = await res.json();
      const found = all.find((x) => x.page === page);
      setForm({
        title: found?.title || "",
        description: found?.description || "",
        og_image: found?.og_image || "",
      });
    }
    setLoading(false);
  }

  const save = async () => {
    setSaving(true);
    setMessage("");
    const res = await adminFetch("/api/admin/seo", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page, ...form }),
    });
    setSaving(false);
    if (res.ok) setMessage("Saved.");
    else setMessage("Failed to save.");
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
        SEO & Metadata
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        How pages appear in Google and when shared on WhatsApp, Facebook, X.
      </p>

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Page
          </label>
          <div className="flex gap-2 flex-wrap">
            {PAGES.map((p) => (
              <button
                key={p.id}
                onClick={() => setPage(p.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                  page === p.id
                    ? "bg-amber-600 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Title (max 60 chars)
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                maxLength={80}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                placeholder="OKMADE Furniture & Interiors"
              />
              <p className="text-xs text-gray-400 mt-1">
                {form.title.length}/60 recommended
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description (max 160 chars)
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                maxLength={200}
                rows="3"
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                placeholder="Handcrafted furniture and interior fit-outs in Aba, Nigeria."
              />
              <p className="text-xs text-gray-400 mt-1">
                {form.description.length}/160 recommended
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Share image URL (optional)
              </label>
              <input
                type="text"
                value={form.og_image}
                onChange={(e) => setForm({ ...form, og_image: e.target.value })}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                placeholder="https://..."
              />
            </div>

            <button
              onClick={save}
              disabled={saving}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 rounded-lg disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            {message && (
              <p className="text-sm text-green-600 dark:text-green-400">{message}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
