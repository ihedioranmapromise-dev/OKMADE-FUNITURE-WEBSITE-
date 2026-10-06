"use client";
import { useState } from "react";
import { adminFetch } from "@/lib/admin-client";

const TEMPLATES = [
  { id: "welcome", label: "Welcome Email" },
  { id: "newFollower", label: "New Follower" },
  { id: "friendRequest", label: "Friend Request" },
  { id: "friendAccepted", label: "Friend Accepted" },
  { id: "newMessage", label: "New Message" },
  { id: "newComment", label: "New Comment" },
  { id: "commentReply", label: "Comment Reply" },
  { id: "postReaction", label: "Post Reaction" },
  { id: "projectUpdate", label: "Project Update" },
  { id: "projectComplete", label: "Project Complete" },
  { id: "okmadeAnnouncement", label: "OKMADE Announcement" },
  { id: "passwordChanged", label: "Password Changed" },
  { id: "promoBanner", label: "Promo Banner" },
  { id: "dataExportReady", label: "Data Export Ready" },
  { id: "referralMilestone", label: "Referral Milestone" },
];

export default function TestEmailTab() {
  const [to, setTo] = useState("");
  const [sending, setSending] = useState(null);
  const [results, setResults] = useState({});

  const sendOne = async (templateId) => {
    if (!to.trim()) {
      alert("Enter an email address first.");
      return;
    }
    setSending(templateId);
    const res = await adminFetch("/api/admin/test-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: to.trim(), template: templateId }),
    });
    const data = await res.json().catch(() => ({}));
    setResults((prev) => ({
      ...prev,
      [templateId]: res.ok ? "sent" : `error: ${data.error || "failed"}`,
    }));
    setSending(null);
  };

  const sendAll = async () => {
    if (!to.trim()) {
      alert("Enter an email address first.");
      return;
    }
    if (!confirm(`Send all ${TEMPLATES.length} templates to ${to}?`)) return;
    for (const t of TEMPLATES) {
      await sendOne(t.id);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
        Test Emails
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Send preview emails to verify templates render correctly. Requires a verified
        domain on Resend for delivery to any address.
      </p>

      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6">
        <p className="text-sm text-amber-800 dark:text-amber-200">
          <strong>Note:</strong> Without a verified sender domain, Resend only delivers
          to the email you signed up with.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Send test to
        </label>
        <div className="flex gap-2 flex-wrap">
          <input
            type="email"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="you@example.com"
            className="flex-1 min-w-[200px] p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
          />
          <button
            onClick={sendAll}
            className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-3 rounded-lg font-medium"
          >
            Send All
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {TEMPLATES.map((t) => (
          <div
            key={t.id}
            className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center gap-3"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                {t.label}
              </p>
              {results[t.id] && (
                <p
                  className={`text-xs mt-1 ${
                    results[t.id] === "sent"
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-500"
                  }`}
                >
                  {results[t.id] === "sent" ? "✓ Sent" : results[t.id]}
                </p>
              )}
            </div>
            <button
              onClick={() => sendOne(t.id)}
              disabled={sending === t.id}
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded text-xs font-medium disabled:opacity-50 flex-shrink-0"
            >
              {sending === t.id ? "..." : "Send"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
