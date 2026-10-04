"use client";
import { useState } from "react";

const TABLES = [
  { id: "clients", label: "Users / Clients" },
  { id: "projects", label: "Projects" },
  { id: "showroom", label: "Showroom Products" },
  { id: "catalogs", label: "Catalogs" },
  { id: "ratings", label: "Product Reviews" },
  { id: "posts", label: "Feed Posts" },
  { id: "project_likes", label: "Project Likes" },
  { id: "product_likes", label: "Product Likes" },
];

export default function ExportTab() {
  const [busy, setBusy] = useState(null);
  const [message, setMessage] = useState("");

  const key = () => sessionStorage.getItem("adminKey") || "";

  const download = async (table) => {
    setBusy(table);
    setMessage("");
    try {
      const res = await fetch(`/api/admin/export?table=${table}`, {
        headers: { "x-admin-key": key() },
      });
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${table}_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setMessage(`${table} exported.`);
    } catch (err) {
      setMessage("Error: " + err.message);
    }
    setBusy(null);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
        Export Data
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Download any table as a CSV file. Open in Excel or Google Sheets.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {TABLES.map((t) => (
          <div
            key={t.id}
            className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center gap-3"
          >
            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
              {t.label}
            </span>
            <button
              onClick={() => download(t.id)}
              disabled={busy === t.id}
              className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 flex-shrink-0"
            >
              {busy === t.id ? "..." : "CSV"}
            </button>
          </div>
        ))}
      </div>

      {message && (
        <p className="mt-4 text-sm text-green-600 dark:text-green-400">{message}</p>
      )}
    </div>
  );
}
