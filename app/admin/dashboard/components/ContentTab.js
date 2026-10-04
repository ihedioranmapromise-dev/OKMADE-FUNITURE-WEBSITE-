"use client";
import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-client";

const FIELDS = [
  { key: "hero_tagline", label: "Hero Tagline", type: "text", default: "Welcome to OKMADE" },
  { key: "hero_title", label: "Hero Title", type: "text", default: "Furniture & Interiors" },
  { key: "hero_subtitle", label: "Hero Subtitle", type: "text", default: "TRUST THE PROGRESS" },
  { key: "hero_description", label: "Hero Description", type: "textarea", default: "Handcrafted pieces for modern living – timeless design, exceptional quality." },
  { key: "about_title", label: "About Title", type: "text", default: "Crafting Interiors, Building Dreams" },
  { key: "about_paragraph_1", label: "About Paragraph 1", type: "textarea", default: "" },
  { key: "about_paragraph_2", label: "About Paragraph 2", type: "textarea", default: "" },
  { key: "about_paragraph_3", label: "About Paragraph 3", type: "textarea", default: "" },
  { key: "about_quote", label: "About Quote", type: "text", default: '"Furniture that tells your story – built to last, designed to inspire."' },
];

export default function ContentTab() {
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const res = await adminFetch("/api/admin/content");
    if (res.ok) {
      const data = await res.json();
      const merged = {};
      FIELDS.forEach((f) => {
        merged[f.key] = data[f.key] ?? f.default;
      });
      setValues(merged);
    } else {
      const merged = {};
      FIELDS.forEach((f) => {
        merged[f.key] = f.default;
      });
      setValues(merged);
    }
    setLoading(false);
  }

  const save = async () => {
    setSaving(true);
    setMessage("");
    const res = await adminFetch("/api/admin/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    setSaving(false);
    if (res.ok) {
      setMessage("Content saved. It will appear on the homepage after refresh.");
    } else {
      setMessage("Failed to save.");
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
        Homepage Content
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Edit homepage text without touching code. Changes appear on next page load.
      </p>

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-5">
        {FIELDS.map((f) => (
          <div key={f.key}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {f.label}
            </label>
            {f.type === "textarea" ? (
              <textarea
                value={values[f.key] || ""}
                onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                rows="3"
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
              />
            ) : (
              <input
                type="text"
                value={values[f.key] || ""}
                onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
              />
            )}
          </div>
        ))}

        <button
          onClick={save}
          disabled={saving}
          className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 rounded-lg disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save All Changes"}
        </button>

        {message && (
          <p className="text-sm text-green-600 dark:text-green-400 text-center">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
