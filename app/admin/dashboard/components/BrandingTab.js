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
          <h2 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">
            Favicon
          </h2>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden border border-gray-200 dark:border-gray-700">
              {currentFavicon ? (
                <img src={currentFavicon} alt="Favicon" className="w-full h-full object-contain" />
              ) : (
                <img src="/favicon.ico" alt="Default" className="w-10 h-10 object-contain" />
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 flex-1">
              Shown in browser tabs and PWA.
            </p>
          </div>
          <label className="cursor-pointer inline-block bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
            {uploading === "favicon" ? "Uploading..." : "Upload Favicon"}
            <input
              type="file"
              accept="image/png,image/svg+xml,image/x-icon,image/vnd.microsoft.icon"
              onChange={(e) => handleUpload("favicon", e)}
              disabled={uploading === "favicon"}
              className="hidden"
            />
          </label>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">
            Logo
          </h2>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-24 h-16 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden border border-gray-200 dark:border-gray-700">
              {currentLogo ? (
                <img src={currentLogo} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <img src="/favicon.ico" alt="Default" className="w-8 h-8 object-contain" />
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 flex-1">
              Shown next to OKMADE text in navbar.
            </p>
          </div>
          <label className="cursor-pointer inline-block bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
            {uploading === "logo" ? "Uploading..." : "Upload Logo"}
            <input
              type="file"
              accept="image/png,image/svg+xml"
              onChange={(e) => handleUpload("logo", e)}
              disabled={uploading === "logo"}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {message && (
        <p className="mt-4 text-sm text-green-600 dark:text-green-400">{message}</p>
      )}
    </div>
  );
}
