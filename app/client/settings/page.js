"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import { useTheme } from "@/lib/theme";

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

const SunIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);
const MoonIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
  </svg>
);
const MonitorIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
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
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState("");
  const router = useRouter();
  const supabase = createSupabaseBrowser();
  const { theme, setTheme } = useTheme();

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
    fetch("/api/client/delete-status")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.pending) setPendingDelete(d);
      })
      .catch(() => {});
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

  const requestDelete = async () => {
    setDeleting(true);
    setDeleteMsg("");
    try {
      const res = await fetch("/api/client/request-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: deleteReason }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Failed");
      setDeleteModal(false);
      setPendingDelete({ pending: true, scheduled_for: data.scheduled_for });
      await supabase.auth.signOut();
      router.push("/client/login?deletion=scheduled");
    } catch (err) {
      setDeleteMsg("Error: " + err.message);
    } finally {
      setDeleting(false);
    }
  };

  const cancelDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch("/api/client/cancel-delete", { method: "POST" });
      if (!res.ok) throw new Error("Failed to cancel");
      setPendingDelete(null);
      setMessage("Deletion cancelled. Your account is safe.");
    } catch (err) {
      setMessage("Error: " + err.message);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950 py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="h-8 w-32 bg-gray-200 dark:bg-gray-800 rounded animate-pulse mb-6"></div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="flex border-b border-gray-200 dark:border-gray-800">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="px-5 py-3">
                  <div className="h-4 w-20 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
            <div className="p-6 space-y-6">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/3 animate-pulse"></div>
                  <div className="h-12 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">
          Settings
        </h1>

        {pendingDelete?.pending && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
            <h3 className="font-semibold text-red-800 dark:text-red-300 mb-1">
              Account scheduled for deletion
            </h3>
            <p className="text-sm text-red-700 dark:text-red-400 mb-3">
              Your account will be permanently deleted on{" "}
              <strong>
                {pendingDelete.scheduled_for
                  ? new Date(pendingDelete.scheduled_for).toLocaleDateString()
                  : "7 days from request"}
              </strong>
              . You can cancel anytime before then.
            </p>
            <button
              onClick={cancelDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {deleting ? "Cancelling..." : "Cancel Deletion"}
            </button>
          </div>
        )}

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="flex border-b border-gray-200 dark:border-gray-800 overflow-x-auto">
            {[
              { id: "privacy", label: "Privacy" },
              { id: "notifications", label: "Notifications" },
              { id: "appearance", label: "Appearance" },
              { id: "security", label: "Security" },
              { id: "danger", label: "Danger Zone" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition ${
                  activeTab === t.id
                    ? "border-amber-600 text-amber-700 dark:text-amber-400"
                    : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Who can see your posts
                  </label>
                  <select
                    value={settings?.post_visibility || "public"}
                    onChange={(e) => handleSave({ post_visibility: e.target.value })}
                    className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                  >
                    <option value="public">Public — Anyone can see</option>
                    <option value="friends">Friends only</option>
                    <option value="private">Only me</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Who can message you
                  </label>
                  <select
                    value={settings?.message_permission || "friends"}
                    onChange={(e) => handleSave({ message_permission: e.target.value })}
                    className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
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
                <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email notifications
                  </span>
                  <input
                    type="checkbox"
                    checked={settings?.email_notifications ?? true}
                    onChange={(e) => handleSave({ email_notifications: e.target.checked })}
                    className="w-5 h-5"
                  />
                </label>
                <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Push notifications
                  </span>
                  <input
                    type="checkbox"
                    checked={settings?.push_notifications ?? true}
                    onChange={(e) => handleSave({ push_notifications: e.target.checked })}
                    className="w-5 h-5"
                  />
                </label>
              </div>
            )}

            {activeTab === "appearance" && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-1">
                    Theme
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Choose how OKMADE looks to you. Your choice is saved to this
                    browser and stays even after you log out.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTheme("light")}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 transition text-left ${
                      theme === "light"
                        ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-amber-300 dark:hover:border-amber-700"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                      <SunIcon className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800 dark:text-gray-100">
                        Light
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Bright and clean
                      </p>
                    </div>
                    {theme === "light" && (
                      <svg
                        className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                      </svg>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setTheme("dark")}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 transition text-left ${
                      theme === "dark"
                        ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-amber-300 dark:hover:border-amber-700"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-gray-800 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                      <MoonIcon className="w-6 h-6 text-amber-300" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800 dark:text-gray-100">
                        Dark
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Easy on the eyes
                      </p>
                    </div>
                    {theme === "dark" && (
                      <svg
                        className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                      </svg>
                    )}
                  </button>
                </div>

                <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <MonitorIcon className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      This setting is saved in a cookie. It applies to every page
                      — public, feed, dashboard — until you change it.
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">
                    Preview
                  </h3>
                  <div className="p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold text-sm">
                        O
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                          Preview
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Example
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      This is how text will look in{" "}
                      <strong>{theme === "dark" ? "dark" : "light"}</strong> mode.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "security" && (
              <form onSubmit={handleChangePassword} className="space-y-4">
                <h3 className="font-semibold text-gray-800 dark:text-gray-100">
                  Change Password
                </h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNew ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg pr-12 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-3 flex items-center text-gray-500 dark:text-gray-400 hover:text-amber-600 transition"
                      onClick={() => setShowNew(!showNew)}
                      aria-label={showNew ? "Hide" : "Show"}
                    >
                      {showNew ? <EyeOff /> : <EyeOpen />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg pr-12 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-3 flex items-center text-gray-500 dark:text-gray-400 hover:text-amber-600 transition"
                      onClick={() => setShowConfirm(!showConfirm)}
                      aria-label={showConfirm ? "Hide" : "Show"}
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
                  <p
                    className={`text-sm ${
                      passwordMsg.includes("Error") ? "text-red-500" : "text-green-600 dark:text-green-400"
                    }`}
                  >
                    {passwordMsg}
                  </p>
                )}
              </form>
            )}

            {activeTab === "danger" && (
              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-1">
                    Download Your Data
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-400 mb-3">
                    Get a copy of everything we have about you — profile, posts, comments,
                    messages, and activity. The file is JSON, readable in any text editor.
                  </p>
                  <a
                    href="/api/client/export-data"
                    className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition"
                  >
                    Download My Data
                  </a>
                </div>

                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <h3 className="font-semibold text-red-800 dark:text-red-300 mb-1">
                    Delete Account
                  </h3>
                  <p className="text-sm text-red-700 dark:text-red-400 mb-3">
                    Permanently delete your account, posts, and data. You'll be logged
                    out immediately. You have 7 days to cancel by clicking the link in
                    the email we'll send you.
                  </p>
                  <button
                    onClick={() => setDeleteModal(true)}
                    disabled={!!pendingDelete?.pending}
                    className="bg-red-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-red-700 transition disabled:opacity-50"
                  >
                    {pendingDelete?.pending ? "Already Scheduled" : "Request Account Deletion"}
                  </button>
                </div>
              </div>
            )}

            {message && (
              <p className="mt-4 text-sm text-green-600 dark:text-green-400">{message}</p>
            )}
          </div>
        </div>

        <a
          href="/client/dashboard"
          className="inline-block mt-6 text-sm text-amber-600 dark:text-amber-400 hover:underline"
        >
          ← Back to Dashboard
        </a>
      </div>

      {deleteModal && (
        <div
          className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4"
          onClick={() => !deleting && setDeleteModal(false)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-red-800 dark:text-red-300 mb-2">
              Delete your account?
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              You'll be logged out immediately. After 7 days, everything is
              permanently deleted. You'll get an email with a cancel link —
              use it if you change your mind.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Reason (optional)
              </label>
              <textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                rows="3"
                maxLength={500}
                className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                placeholder="Tell us why you're leaving (helps us improve)..."
              />
            </div>
            {deleteMsg && <p className="text-sm text-red-500 mb-3">{deleteMsg}</p>}
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal(false)}
                disabled={deleting}
                className="flex-1 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium py-2.5 rounded-lg disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={requestDelete}
                disabled={deleting}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 rounded-lg disabled:opacity-50"
              >
                {deleting ? "Scheduling..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
