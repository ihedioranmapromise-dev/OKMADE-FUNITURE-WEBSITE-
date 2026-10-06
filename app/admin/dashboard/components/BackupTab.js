"use client";
import { useEffect, useState } from "react";
import BackupSchedulePanel from "./BackupSchedulePanel";

export default function BackupTab() {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const key = () => sessionStorage.getItem("adminKey") || "";

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/backup", { headers: { "x-admin-key": key() } });
    if (res.ok) setBackups(await res.json());
    setLoading(false);
  }

  const download = async () => {
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/backup", {
        method: "POST",
        headers: { "x-admin-key": key() },
      });
      if (!res.ok) throw new Error("Backup failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `okmade_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setMessage("Backup downloaded. Save it somewhere safe (Google Drive, etc.).");
      load();
    } catch (err) {
      setMessage("Error: " + err.message);
    }
    setBusy(false);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
        Data Backup
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Full JSON dump of your database. Does not include Storage files (images).
      </p>

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <button
          onClick={download}
          disabled={busy}
          className="w-full md:w-auto bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 px-6 rounded-lg disabled:opacity-50"
        >
          {busy ? "Creating Backup..." : "Download Full Backup Now"}
        </button>
        {message && (
          <p className="text-sm text-green-600 dark:text-green-400 mt-3">{message}</p>
        )}
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">
          Recent Backups
        </h2>
        {loading ? (
          <div className="h-20 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
        ) : backups.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No backups yet. Click the button above to create your first one.
          </p>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {backups.map((b) => (
              <div key={b.id} className="py-3 flex justify-between items-center">
                <div>
                  <p className="text-sm font-mono text-gray-800 dark:text-gray-200">
                    {b.filename}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {b.record_count} records ·{" "}
                    {(b.size_bytes / 1024).toFixed(1)} KB ·{" "}
                    {new Date(b.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BackupSchedulePanel />
    </div>
  );
}
