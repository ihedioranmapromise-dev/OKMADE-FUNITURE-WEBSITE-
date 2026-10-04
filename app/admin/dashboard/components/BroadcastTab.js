"use client";
import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-client";

const PRESETS = [
  {
    label: "New Product",
    title: "New in our showroom",
    body: "A new piece just arrived in our showroom. Take a look!",
  },
  {
    label: "New Project",
    title: "New project started",
    body: "We've just started work on a new project. Follow along to see progress.",
  },
  {
    label: "Festive Greeting",
    title: "Season's greetings from OKMADE",
    body: "Thank you for being part of our journey. Wishing you the very best.",
  },
];

export default function BroadcastTab() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [followerCount, setFollowerCount] = useState(null);

  useEffect(() => {
    loadFollowerCount();
  }, []);

  async function loadFollowerCount() {
    try {
      const res = await adminFetch("/api/admin/stats");
      if (res.ok) {
        const data = await res.json();
        setFollowerCount(data.users || 0);
      }
    } catch {}
  }

  const applyPreset = (p) => {
    setTitle(p.title);
    setBody(p.body);
  };

  const send = async () => {
    if (!title.trim() || !body.trim()) return;
    if (!confirm("Send this email to all OKMADE followers?")) return;
    setSending(true);
    setResult(null);
    try {
      const res = await adminFetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          ctaUrl: ctaUrl.trim() || undefined,
        }),
      });
      const data = await res.json();
      setResult(data);
      if (res.ok) {
        setTitle("");
        setBody("");
        setCtaUrl("");
      }
    } catch (err) {
      setResult({ error: err.message });
    }
    setSending(false);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">
        Broadcast Email
      </h1>

      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6">
        <p className="text-sm text-amber-800 dark:text-amber-200">
          Sends an email to <strong>all users who follow OKMADE</strong>.
          {followerCount !== null && ` (${followerCount} total users)`}
        </p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Quick Templates
          </label>
          <div className="flex gap-2 flex-wrap">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => applyPreset(p)}
                className="text-xs bg-gray-100 dark:bg-gray-800 hover:bg-amber-100 dark:hover:bg-amber-900/30 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-full"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Subject / Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
              placeholder="e.g., New collection is live"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Body *
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows="6"
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
              placeholder="Write your announcement..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Call-to-Action URL (optional)
            </label>
            <input
              type="text"
              value={ctaUrl}
              onChange={(e) => setCtaUrl(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
              placeholder="https://okmade.vercel.app/feed"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              If provided, a button will link to this URL.
            </p>
          </div>

          <button
            onClick={send}
            disabled={sending || !title.trim() || !body.trim()}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 rounded-lg disabled:opacity-50"
          >
            {sending ? "Sending..." : "Send to All Followers"}
          </button>

          {result && (
            <div
              className={`p-4 rounded-lg ${
                result.error
                  ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"
                  : "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
              }`}
            >
              {result.error ? (
                <p className="text-sm">Error: {result.error}</p>
              ) : (
                <p className="text-sm">
                  ✅ Sent: <strong>{result.sent}</strong> · Skipped:{" "}
                  <strong>{result.skipped}</strong> · Failed:{" "}
                  <strong>{result.failed}</strong> · Total:{" "}
                  <strong>{result.total}</strong>
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
