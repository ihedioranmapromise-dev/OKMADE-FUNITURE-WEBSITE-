"use client";
import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-client";

export default function BackupSchedulePanel() {
  const [schedule, setSchedule] = useState({ enabled: false, frequency: "weekly" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const res = await adminFetch("/api/admin/backup-schedule");
    if (res.ok) setSchedule(await res.json());
    setLoading(false);
  }

  const save = async (updates) => {
    setSaving(true);
    setMessage("");
    const next = { ...schedule, ...updates };
    const res = await adminFetch("/api/admin/backup-schedule", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: next.enabled, frequency: next.frequency }),
    });
    setSaving(false);
    if (res.ok) {
      setSchedule(next);
      setMessage("Saved.");
    } else {
      setMessage("Failed to save.");
    }
  };

  if (loading) {
    return <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />;
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 mt-6">
      <h2 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">
        Scheduled Backups
      </h2>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
        Requires the cron job to be enabled (Pro plan). Meanwhile, download manually anytime.
      </p>

      <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer mb-3">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Enable scheduled backups
        </span>
        <input
          type="checkbox"
          checked={schedule.enabled}
          onChange={(e) => save({ enabled: e.target.checked })}
          disabled={saving}
          className="w-5 h-5"
        />
      </label>

      {schedule.enabled && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Frequency
          </label>
          <select
            value={schedule.frequency}
            onChange={(e) => save({ frequency: e.target.value })}
            disabled={saving}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
      )}

      {message && (
        <p className="text-sm text-green-600 dark:text-green-400 mt-3">{message}</p>
      )}
    </div>
  );
}
