"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase-browser";

const EyeOpen = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);
const EyeOff = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
);

export default function SettingsPage() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState("privacy");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState("");

  // Delete account flow
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState("");
  const [deleteRequested, setDeleteRequested] = useState(false);

  const router = useRouter();
  const supabase = createSupabaseBrowser();

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => {
        if (r.status === 401) {
          router.push("/client/login");
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (data) setSettings(data);
        setLoading(false);
      });
  }, []);

  const handleSave = async (updates) => {
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...settings, ...updates }),
    });
    if (res.ok) {
      setSettings({ ...settings, ...updates });
      setMessage("Settings saved.");
    } else {
      setMessage("Error saving settings.");
    }
    setSaving(false);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMsg("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMsg("Minimum 6 characters.");
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) setPasswordMsg("Error: " + error.message);
    else {
      setPasswordMsg("Password updated.");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setDeleteMsg("");
    try {
      const res = await fetch("/api/client/request-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: deleteReason }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to submit request");
      }
      setDeleteRequested(true);
      setDeleteModalOpen(false);
      setDeleteReason("");
    } catch (err) {
      setDeleteMsg("Error: " + err.message);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="h-8 w-32 bg-gray-200 rounded animate-pulse mb-6"></div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="flex border-b">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="px-5 py-3">
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
            <div className="p-6 space-y-6">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse"></div>
                  <div className="h-12 bg-gray-100 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Settings</h1>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex border-b overflow-x-auto">
            {[
              { id: "privacy", label: "Privacy" },
              { id: "notifications", label: "Notifications" },
              { id: "security", label: "Security" },
              { id: "danger", label: "Danger Zone" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition ${
                  activeTab === t.id
                    ? "border-amber-600 text-amber-700"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === "privacy" && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Who can see your posts
                  </label>
                  <select
                    value={settings?.post_visibility || "public"}
                    onChange={(e) => handleSave({ post_visibility: e.target.value })}
                    className="w-full p-3 border rounded-lg"
                  >
                    <option value="public">Public — Anyone can see</option>
                    <option value="friends">Friends only</option>
                    <option value="private">Only me</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Who can message you
                  </label>
                  <select
                    value={settings?.message_permission || "friends"}
                    onChange={(e) => handleSave({ message_permission: e.target.value })}
                    className="w-full p-3 border rounded-lg"
                  >
                    <option value="everyone">Everyone</option>
                    <option value="friends">Friends only</option>
                    <option value="nobody">Nobody</option>
                  </select>
                </div>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="space-y-4">
                <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer">
                  <span className="text-sm font-medium text-gray-700">Email notifications</span>
                  <input
                    type="checkbox"
                    checked={settings?.email_notifications ?? true}
                    onChange={(e) => handleSave({ email_notifications: e.target.checked })}
                    className="w-5 h-5"
                  />
                </label>
                <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer">
                  <span className="text-sm font-medium text-gray-700">Push notifications</span>
                  <input
                    type="checkbox"
                    checked={settings?.push_notifications ?? true}
                    onChange={(e) => handleSave({ push_notifications: e.target.checked })}
                    className="w-5 h-5"
                  />
                </label>
              </div>
            )}

            {activeTab === "security" && (
              <form onSubmit={handleChangePassword} className="space-y-4">
                <h3 className="font-semibold text-gray-800">Change Password</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNew ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full p-3 border rounded-lg pr-12"
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-amber-600 transition"
                      onClick={() => setShowNew(!showNew)}
                      aria-label={showNew ? "Hide password" : "Show password"}
                    >
                      {showNew ? <EyeOff /> : <EyeOpen />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full p-3 border rounded-lg pr-12"
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-amber-600 transition"
                      onClick={() => setShowConfirm(!showConfirm)}
                      aria-label={showConfirm ? "Hide password" : "Show password"}
                    >
                      {showConfirm ? <EyeOff /> : <EyeOpen />}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  className="bg-amber-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-amber-700 transition"
                >
                  Update Password
                </button>
                {passwordMsg && (
                  <p className={`text-sm ${passwordMsg.includes("Error") ? "text-red-500" : "text-green-600"}`}>
                    {passwordMsg}
                  </p>
                )}
              </form>
            )}

            {activeTab === "danger" && (
              <div className="space-y-4">
                {deleteRequested ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="font-semibold text-green-800 mb-1">Request received</h3>
                    <p className="text-sm text-green-700">
                      We've received your account deletion request. Our team will process it
                      within 7 days. You'll get a confirmation email when it's complete.
                    </p>
                  </div>
                ) : (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h3 className="font-semibold text-red-800 mb-1">Delete Account</h3>
                    <p className="text-sm text-red-600 mb-3">
                      Permanently delete your account, posts, and data. This cannot be undone.
                      Our team will review your request and process it manually.
                    </p>
                    <button
                      onClick={() => setDeleteModalOpen(true)}
                      className="bg-red-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-red-700 transition"
                    >
                      Request Account Deletion
                    </button>
                  </div>
                )}
              </div>
            )}

            {message && <p className="mt-4 text-sm text-green-600">{message}</p>}
          </div>
        </div>

        <a
          href="/client/dashboard"
          className="inline-block mt-6 text-sm text-amber-600 hover:underline"
        >
          ← Back to Dashboard
        </a>
      </div>

      {/* Delete confirmation modal */}
      {deleteModalOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4"
          onClick={() => !deleting && setDeleteModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-red-800 mb-2">
              Request account deletion?
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              This sends a request to OKMADE support. Your account will be reviewed
              and permanently deleted within 7 days. You can still log in during
              this time.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason (optional)
              </label>
              <textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                rows="3"
                maxLength={500}
                className="w-full p-3 border rounded-lg text-sm focus:ring-2 focus:ring-red-400"
                placeholder="Tell us why you're leaving (helps us improve)..."
              />
              <p className="text-xs text-gray-400 mt-1">
                {deleteReason.length}/500
              </p>
            </div>
            {deleteMsg && (
              <p className="text-sm text-red-500 mb-3">{deleteMsg}</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModalOpen(false)}
                disabled={deleting}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2.5 rounded-lg transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 rounded-lg transition disabled:opacity-50"
              >
                {deleting ? "Sending..." : "Yes, Request Deletion"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
