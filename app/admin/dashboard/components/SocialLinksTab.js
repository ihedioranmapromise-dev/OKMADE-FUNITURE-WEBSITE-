"use client";
import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-client";

const FIELDS = [
  { key: "social_whatsapp", label: "WhatsApp", placeholder: "https://wa.me/234..." },
  { key: "social_instagram", label: "Instagram", placeholder: "https://instagram.com/..." },
  { key: "social_facebook", label: "Facebook", placeholder: "https://facebook.com/..." },
  { key: "social_tiktok", label: "TikTok", placeholder: "https://tiktok.com/@..." },
  { key: "social_x", label: "X (Twitter)", placeholder: "https://x.com/..." },
  { key: "social_youtube", label: "YouTube", placeholder: "https://youtube.com/..." },
  { key: "social_linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/..." },
  { key: "contact_email", label: "Contact Email", placeholder: "hello@okmade.com" },
  { key: "contact_phone_1", label: "Phone 1", placeholder: "09166300206" },
  { key: "contact_phone_2", label: "Phone 2", placeholder: "07049264672" },
  { key: "contact_address", label: "Address", placeholder: "Aba, Abia State, Nigeria" },
];

export default function SocialLinksTab() {
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const res = await adminFetch("/api/admin/social-links");
    if (res.ok) setValues(await res.json());
    setLoading(false);
  }

  const save = async () => {
    setSaving(true);
    setMessage("");
    const res = await adminFetch("/api/admin/social-links", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    setSaving(false);
    if (res.ok) setMessage("Saved.");
    else setMessage("Failed to save.");
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
        Social Links & Contact
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Where your customers can find and reach you.
      </p>

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-4">
        {FIELDS.map((f) => (
          <div key={f.key}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {f.label}
            </label>
            <input
              type="text"
              value={values[f.key] || ""}
              onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
              placeholder={f.placeholder}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
            />
          </div>
        ))}

        <button
          onClick={save}
          disabled={saving}
          className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 rounded-lg disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save All"}
        </button>
        {message && (
          <p className="text-sm text-green-600 dark:text-green-400 text-center">{message}</p>
        )}
      </div>
    </div>
  );
}
