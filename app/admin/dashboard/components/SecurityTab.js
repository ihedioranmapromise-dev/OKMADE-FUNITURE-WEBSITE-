"use client";
import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-client";

export default function SecurityTab() {
  const [tab, setTab] = useState("2fa");

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">
        Security
      </h1>

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          {[
            { id: "2fa", label: "Two-Factor Auth" },
            { id: "sessions", label: "Sessions" },
            { id: "audit", label: "User Audit Log" },
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
          {tab === "2fa" && <TwoFactorPanel />}
          {tab === "sessions" && <SessionsPanel />}
          {tab === "audit" && <AuditPanel />}
        </div>
      </div>
    </div>
  );
}

function TwoFactorPanel() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [setupData, setSetupData] = useState(null);
  const [token, setToken] = useState("");
  const [backupCodes, setBackupCodes] = useState([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const res = await adminFetch("/api/admin/2fa");
    if (res.ok) setStatus(await res.json());
    setLoading(false);
  }

  const startSetup = async () => {
    setBusy(true);
    setMessage("");
    const res = await adminFetch("/api/admin/2fa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "setup" }),
    });
    const data = await res.json();
    setBusy(false);
    if (res.ok) {
      setSetupData(data);
    } else {
      setMessage("Error: " + (data.error || "Failed"));
    }
  };

  const confirmEnable = async () => {
    if (!token.trim()) return;
    setBusy(true);
    setMessage("");
    const res = await adminFetch("/api/admin/2fa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "enable", token: token.trim() }),
    });
    const data = await res.json();
    setBusy(false);
    if (res.ok) {
      setBackupCodes(data.backup_codes);
      setSetupData(null);
      setToken("");
      await load();
    } else {
      setMessage("Error: " + (data.error || "Failed"));
    }
  };

  const disable = async () => {
    if (!token.trim()) {
      setMessage("Enter a 6-digit code or a backup code to disable.");
      return;
    }
    if (!confirm("Disable two-factor authentication?")) return;
    setBusy(true);
    setMessage("");
    const res = await adminFetch("/api/admin/2fa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "disable", token: token.trim() }),
    });
    const data = await res.json();
    setBusy(false);
    if (res.ok) {
      setToken("");
      setBackupCodes([]);
      await load();
      setMessage("2FA disabled.");
    } else {
      setMessage("Error: " + (data.error || "Failed"));
    }
  };

  if (loading) {
    return <div className="h-40 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />;
  }

  if (backupCodes.length > 0) {
    return (
      <div>
        <h3 className="font-bold text-green-700 dark:text-green-400 mb-2">
          ✓ Two-factor authentication is now enabled
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Save these backup codes somewhere safe. Each can be used once if you lose access to your authenticator.
        </p>
        <div className="grid grid-cols-2 gap-2 max-w-md">
          {backupCodes.map((c) => (
            <div
              key={c}
              className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-2 text-center font-mono text-sm text-amber-800 dark:text-amber-300"
            >
              {c}
            </div>
          ))}
        </div>
        <button
          onClick={() => {
            const text = backupCodes.join("\n");
            navigator.clipboard.writeText(text);
            setMessage("Copied!");
          }}
          className="mt-4 bg-gray-200 dark:bg-gray-800 px-4 py-2 rounded-lg text-sm font-medium"
        >
          Copy all codes
        </button>
      </div>
    );
  }

  if (setupData) {
    return (
      <div>
        <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">
          Step 1 — Scan this in your authenticator app
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Use Google Authenticator, Authy, or any TOTP app. Then enter the 6-digit code below.
        </p>

        <div className="bg-white border-2 border-gray-200 dark:border-gray-700 rounded-xl p-4 inline-block mb-4">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
              setupData.otpauth_url
            )}`}
            alt="QR Code"
            className="w-48 h-48"
          />
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
          Or enter this secret manually:
        </p>
        <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg font-mono text-sm break-all mb-4">
          {setupData.secret}
        </div>

        <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-2 mt-6">
          Step 2 — Enter the 6-digit code
        </h3>
        <div className="flex gap-2 max-w-xs">
          <input
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="123456"
            inputMode="numeric"
            className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-center text-xl font-mono tracking-widest bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
          />
          <button
            onClick={confirmEnable}
            disabled={busy || token.length !== 6}
            className="bg-amber-600 hover:bg-amber-700 text-white px-4 rounded-lg font-medium disabled:opacity-50"
          >
            {busy ? "..." : "Enable"}
          </button>
        </div>

        <button
          onClick={() => setSetupData(null)}
          className="mt-4 text-sm text-gray-500 dark:text-gray-400 hover:underline"
        >
          Cancel
        </button>

        {message && <p className="text-sm text-red-500 mt-3">{message}</p>}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div
          className={`w-3 h-3 rounded-full ${
            status?.enabled ? "bg-green-500" : "bg-gray-400"
          }`}
        />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {status?.enabled ? "Enabled" : "Not enabled"}
        </span>
      </div>

      {status?.enabled ? (
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Two-factor authentication is protecting your admin account.
          </p>
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="6-digit code or backup code"
              className="flex-1 min-w-[220px] p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
            />
            <button
              onClick={disable}
              disabled={busy || !token.trim()}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-medium disabled:opacity-50"
            >
              {busy ? "..." : "Disable 2FA"}
            </button>
          </div>
        </div>
      ) : (
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Add an extra layer of protection. Even if someone gets your password, they can't log in without your phone.
          </p>
          <button
            onClick={startSetup}
            disabled={busy}
            className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-lg font-medium disabled:opacity-50"
          >
            {busy ? "..." : "Set Up 2FA"}
          </button>
        </div>
      )}

      {message && <p className="text-sm text-red-500 mt-3">{message}</p>}
    </div>
  );
}

function SessionsPanel() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const res = await adminFetch("/api/admin/sessions");
    if (res.ok) setSessions(await res.json());
    setLoading(false);
  }

  const killAll = async () => {
    if (!confirm("Sign out from all other sessions? You'll need to log in again.")) return;
    setBusy(true);
    setMessage("");
    const res = await adminFetch("/api/admin/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "kill_all" }),
    });
    const data = await res.json();
    setBusy(false);
    if (res.ok) {
      setMessage(data.message);
      setTimeout(() => {
        sessionStorage.removeItem("adminAuth");
        sessionStorage.removeItem("adminKey");
        window.location.href = "/admin/login";
      }, 1500);
    } else {
      setMessage("Failed");
    }
  };

  return (
    <div>
      <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">
        Kill All Admin Sessions
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        If you suspect your admin password was leaked, use this to sign out everywhere. You'll need to log in again with your new password.
      </p>
      <button
        onClick={killAll}
        disabled={busy}
        className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-lg font-medium disabled:opacity-50"
      >
        {busy ? "..." : "Kill All Other Sessions"}
      </button>

      {message && (
        <p className="mt-3 text-sm text-green-600 dark:text-green-400">{message}</p>
      )}
    </div>
  );
}

function AuditPanel() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const res = await adminFetch("/api/admin/user-audit");
    if (res.ok) setItems(await res.json());
    setLoading(false);
  }

  const filtered = search.trim()
    ? items.filter((i) =>
        (i.username || "").toLowerCase().includes(search.toLowerCase()) ||
        (i.action || "").toLowerCase().includes(search.toLowerCase())
      )
    : items;

  if (loading) {
    return <div className="h-40 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />;
  }

  return (
    <div>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by username or action..."
        className="w-full md:max-w-md p-3 border border-gray-300 dark:border-gray-600 rounded-lg mb-4 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
      />

      {filtered.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No audit entries yet. Actions will appear here as users do things.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="py-2 px-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">User</th>
                <th className="py-2 px-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Action</th>
                <th className="py-2 px-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">IP</th>
                <th className="py-2 px-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">When</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 200).map((a) => (
                <tr key={a.id} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-2 px-3 text-sm text-gray-700 dark:text-gray-300">
                    {a.username ? `@${a.username}` : "—"}
                  </td>
                  <td className="py-2 px-3 text-xs font-mono text-gray-600 dark:text-gray-400">
                    {a.action}
                  </td>
                  <td className="py-2 px-3 text-xs text-gray-500 dark:text-gray-400">
                    {a.ip || "—"}
                  </td>
                  <td className="py-2 px-3 text-xs text-gray-500 dark:text-gray-400">
                    {new Date(a.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
