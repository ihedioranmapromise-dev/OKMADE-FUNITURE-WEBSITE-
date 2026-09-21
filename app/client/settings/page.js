"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase-browser";

export default function SettingsPage() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState("privacy");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");
  const router = useRouter();
  const supabase = createSupabaseBrowser();

  useEffect(() => {
    fetch("/api/settings").then((r) => {
      if (r.status === 401) { router.push("/client/login"); return null; }
      return r.json();
    }).then((data) => {
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
    if (newPassword !== confirmPassword) { setPasswordMsg("Passwords do not match."); return; }
    if (newPassword.length < 6) { setPasswordMsg("Minimum 6 characters."); return; }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) setPasswordMsg("Error: " + error.message);
    else {
      setPasswordMsg("Password updated.");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm("This will permanently delete your account and all your data. Are you sure?")) return;
    if (!confirm("Really? This cannot be undone.")) return;
    // Deleting auth user requires a server-side call – simplified here:
    alert("Please contact support to fully delete your account.");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-amber-600">Loading settings...</div>;

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Settings</h1>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Tabs */}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Who can see your posts</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Who can message you</label>
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
                <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Email notifications</span>
                  <input
                    type="checkbox"
                    checked={settings?.email_notifications ?? true}
                    onChange={(e) => handleSave({ email_notifications: e.target.checked })}
                    className="w-5 h-5"
                  />
                </label>
                <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full p-3 border rounded-lg" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full p-3 border rounded-lg" required />
                </div>
                <button type="submit" className="bg-amber-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-amber-700 transition">
                  Update Password
                </button>
                {passwordMsg && <p className="text-sm text-amber-700">{passwordMsg}</p>}
              </form>
            )}

            {activeTab === "danger" && (
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="font-semibold text-red-800 mb-1">Delete Account</h3>
                  <p className="text-sm text-red-600 mb-3">
                    Permanently delete your account, posts, and data. This cannot be undone.
                  </p>
                  <button onClick={handleDeleteAccount} className="bg-red-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-red-700 transition">
                    Delete My Account
                  </button>
                </div>
              </div>
            )}

            {message && <p className="mt-4 text-sm text-green-600">{message}</p>}
          </div>
        </div>

        <a href="/client/dashboard" className="inline-block mt-6 text-sm text-amber-600 hover:underline">
          ← Back to Dashboard
        </a>
      </div>
    </div>
  );
}
