"use client";
import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-client";

export default function BrandingTab() {
  const [content, setContent] = useState({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const res = await adminFetch("/api/admin/content");
    if (res.ok) setContent(await res.json());
    setLoading(false);
  }

  const handleUpload = async (type, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 512 * 1024) {
      setMessage("Image too large. Use under 500KB.");
      return;
    }
    setUploading(type);
    setMessage("");
    try {
      const reader = new FileReader();
      const dataUrl = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await adminFetch("/api/admin/branding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, data_url: dataUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setContent({ ...content, [`branding_${type}_url`]: data.url });
      setMessage(`${type} updated. Refresh to see changes.`);
    } catch (err) {
      setMessage("Error: " + err.message);
    } finally {
      setUploading(null);
    }
  };

  const currentFavicon = content.branding_favicon_url;
  const currentLogo = content.branding_logo_url;

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-8 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="h-40 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
        Branding
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Upload your site favicon and logo. Max 500KB. PNG or SVG recommended.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="font-semibold text-gray-800 dark
