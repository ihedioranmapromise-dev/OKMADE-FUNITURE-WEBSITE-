"use client";
import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-client";

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

export default function SettingsTab() {
  const [tab, setTab] = useState("password");

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">
        Admin Settings
      </h1>

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          {[
            { id: "password", label: "Password" },
            { id: "email", label: "Admin Email" },
            { id: "ips", label: "Blocked IPs" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition ${
                tab === t.id
                  ? "border-amber-600 text-amber-700 dark:text-amber-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {tab === "password" && <PasswordForm />}
          {tab === "email" && <EmailForm />}
          {tab === "ips" && <IpsForm />}
        </div>
      </div>
    </div>
  );
}

function PasswordForm() {
  const [current, setCurrent] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setMessage("");
    setSuccess(false);
    if (newPass !== confirm) {
      setMessage("New passwords do not match.");
      return;
    }
    if (newPass.length < 12) {
      setMessage("New password must be at least 12 characters.");
      return;
    }
    if (!confirm("Are you sure you want to change the admin password? Existing sessions will need to log in again.")) return;

    setSaving(true);
    const res = await adminFetch("/api/admin/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        current_password: current,
        new_password: newPass,
      }),
    });
    setSaving(false);
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setSuccess(true);
      setMessage("Password changed. You will need to log in again.");
      setCurrent("");
      setNewPass("");
      setConfirm("");
      setTimeout(() => {
        sessionStorage.removeItem("adminAuth");
        sessionStorage.removeItem("adminKey");
        window.location.href = "/admin/login";
      }, 2200);
    } else {
      setMessage("Error: " + (data.error || "Failed to change"));
    }
  };

  return (
    <form onSubmit={submit} className="max-w-md space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Current Password
        </label>
        <div className="relative">
          <input
            type={showCurrent ? "text" : "password"}
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg pr-12 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
            required
          />
          <button
            type="button"
            onClick={() => setShowCurrent(!showCurrent)}
            className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-amber-600"
          >
            {showCurrent ? <EyeOff /> : <EyeOpen />}
          </button>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          New Password (min 12 characters)
        </label>
        <div className="relative">
          <input
            type={showNew ? "text" : "password"}
            value={newPass}
            onChange={(e) => setNewPass(e.target.value)}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg pr-12 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
            required
          />
          <button
            type="button"
            onClick={() => setShowNew(!showNew)}
            className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-amber-600"
          >
            {showNew ? <EyeOff /> : <EyeOpen />}
          </button>
        </div>
        {newPass && (
          <div className="mt-2 flex gap-1">
            <div className={`h-1 flex-1 rounded ${newPass.length >= 12 ? "bg-green-500" : "bg-gray-300 dark:bg-gray-700"}`} />
            <div className={`h-1 flex-1 rounded ${newPass.length >= 16 ? "bg-green-500" : "bg-gray-300 dark:bg-gray-700"}`} />
            <div className={`h-1 flex-1 rounded ${newPass.length >= 20 ? "bg-green-500" : "bg-gray-300 dark:bg-gray-700"}`} />
          </div>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Confirm New Password
        </label>
        <div className="relative">
          <input
            type={showConfirm ? "text" : "password"}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg pr-12 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
            required
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-amber-600"
          >
            {showConfirm ? <EyeOff /> : <EyeOpen />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 rounded-lg disabled:opacity-50"
      >
        {saving ? "Changing..." : "Change Password"}
      </button>

      {message && (
        <p className={`text-sm ${success ? "text-green-600 dark:text-green-400" : "text-red-500"}`}>
          {message}
        </p>
      )}
    </form>
  );
}

function EmailForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    adminFetch("/api/admin/settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) setEmail(d.admin_email || "");
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const save = async () => {
    if (!email.trim()) return;
    setSaving(true);
    setMessage("");
    const res = await adminFetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ admin_email: email.trim() }),
    });
    setSaving(false);
    if (res.ok) setMessage("Admin email updated.");
    else setMessage("Failed to save.");
  };

  if (loading) return <div className="h-20 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />;

  return (
    <div className="max-w-md space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Admin Notification Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Deletion requests and system alerts go to this address.
        </p>
      </div>
      <button
        onClick={save}
        disabled={saving}
        className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 rounded-lg disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save"}
      </button>
      {message && (
        <p className="text-sm text-green-600 dark:text-green-400">{message}</p>
      )}
    </div>
  );
}

function IpsForm() {
  const [ips, setIps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ip, setIp] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const res = await adminFetch("/api/admin/ip-block");
    if (res.ok) setIps(await res.json());
    setLoading(false);
  }

  const add = async () => {
    if (!ip.trim()) return;
    setBusy(true);
    const res = await adminFetch("/api/admin/ip-block", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ip: ip.trim(), reason: reason.trim() }),
    });
    setBusy(false);
    if (res.ok) {
      setIp("");
      setReason("");
      load();
    } else {
      alert("Failed — IP may already be blocked.");
    }
  };

  const remove = async (id) => {
    if (!confirm("Unblock this IP?")) return;
    const res = await adminFetch(`/api/admin/ip-block?id=${id}`, { method: "DELETE" });
    if (res.ok) load();
  };

  if (loading) return <div className="h-40 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <input
          type="text"
          value={ip}
          onChange={(e) => setIp(e.target.value)}
          placeholder="IP address"
          className="md:col-span-2 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
        />
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason (optional)"
          className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
        />
      </div>
      <button
        onClick={add}
        disabled={busy || !ip.trim()}
        className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-lg font-medium disabled:opacity-50"
      >
        Block IP
      </button>

      {ips.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No blocked IPs. Currently everyone can access the site.
        </p>
      ) : (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg divide-y divide-gray-200 dark:divide-gray-700">
          {ips.map((b) => (
            <div key={b.id} className="flex justify-between items-center p-3">
              <div>
                <p className="font-mono text-sm text-gray-800 dark:text-gray-200">{b.ip}</p>
                {b.reason && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">{b.reason}</p>
                )}
                <p className="text-xs text-gray-400">
                  {new Date(b.created_at).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => remove(b.id)}
                className="text-red-600 dark:text-red-400 hover:underline text-sm"
              >
                Unblock
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
