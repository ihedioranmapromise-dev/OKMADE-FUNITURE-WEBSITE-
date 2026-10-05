"use client";
import { useEffect, useState, useMemo } from "react";
import { adminFetch } from "@/lib/admin-client";

const PAGE_SIZE = 15;

export default function UsersTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState(new Set());
  const [notifyUser, setNotifyUser] = useState(null);
  const [notifyMessage, setNotifyMessage] = useState("");
  const [notifyUrl, setNotifyUrl] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const res = await adminFetch("/api/admin/users");
    if (res.ok) setUsers(await res.json());
    setLoading(false);
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(
      (u) =>
        (u.username || "").toLowerCase().includes(q) ||
        (u.display_name || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q) ||
        (u.skill || "").toLowerCase().includes(q)
    );
  }, [users, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSelect = (id) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const toggleSelectAll = () => {
    if (selected.size === paginated.length) setSelected(new Set());
    else setSelected(new Set(paginated.map((u) => u.id)));
  };

  const updateUser = async (id, updates) => {
    setBusy(true);
    const res = await adminFetch("/api/admin/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...updates }),
    });
    setBusy(false);
    if (res.ok) {
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...updates } : u)));
      setMessage("User updated.");
    } else {
      setMessage("Failed to update.");
    }
  };

  const bulkAction = async (action) => {
    if (selected.size === 0) return;
    const verb = {
      verify: "verify",
      unverify: "unverify",
      suspend: "suspend",
      unsuspend: "unsuspend",
    }[action];
    if (!confirm(`${verb} ${selected.size} user(s)?`)) return;
    setBusy(true);
    const res = await adminFetch("/api/admin/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(selected), action }),
    });
    setBusy(false);
    if (res.ok) {
      setMessage(`Bulk ${verb} done for ${selected.size} user(s).`);
      setSelected(new Set());
      load();
    } else {
      setMessage("Bulk action failed.");
    }
  };

  const sendNotify = async () => {
    if (!notifyUser || !notifyMessage.trim()) return;
    setBusy(true);
    const res = await adminFetch("/api/admin/notify-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: notifyUser.id,
        message: notifyMessage.trim(),
        target_url: notifyUrl.trim() || null,
      }),
    });
    setBusy(false);
    if (res.ok) {
      setNotifyUser(null);
      setNotifyMessage("");
      setNotifyUrl("");
      setMessage("Notification sent.");
    } else {
      setMessage("Failed to send.");
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-14 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          Users & Artisans
        </h1>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {users.length} total
        </span>
      </div>

      {selected.size > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 mb-4 flex items-center gap-3 flex-wrap">
          <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
            {selected.size} selected
          </span>
          <button
            onClick={() => bulkAction("verify")}
            disabled={busy}
            className="text-xs bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700 disabled:opacity-50"
          >
            Verify all
          </button>
          <button
            onClick={() => bulkAction("unverify")}
            disabled={busy}
            className="text-xs bg-gray-600 text-white px-3 py-1.5 rounded hover:bg-gray-700 disabled:opacity-50"
          >
            Unverify all
          </button>
          <button
            onClick={() => bulkAction("suspend")}
            disabled={busy}
            className="text-xs bg-red-600 text-white px-3 py-1.5 rounded hover:bg-red-700 disabled:opacity-50"
          >
            Suspend all
          </button>
          <button
            onClick={() => bulkAction("unsuspend")}
            disabled={busy}
            className="text-xs bg-gray-500 text-white px-3 py-1.5 rounded hover:bg-gray-600 disabled:opacity-50"
          >
            Unsuspend all
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="text-xs text-amber-700 dark:text-amber-300 hover:underline ml-auto"
          >
            Clear
          </button>
        </div>
      )}

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name, username, email or skill..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full md:max-w-md p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-amber-500"
        />
      </div>

      {message && (
        <p className="text-sm text-green-600 dark:text-green-400 mb-3">{message}</p>
      )}

      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center text-gray-500 dark:text-gray-400">
          {search ? "No users match your search." : "No users yet."}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <table className="min-w-full">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="py-3 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={paginated.length > 0 && selected.size === paginated.length}
                      onChange={toggleSelectAll}
                      className="w-4 h-4"
                    />
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">User</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Contact</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Skill</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Status</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Joined</th>
                  <th className="py-3 px-4 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selected.has(u.id)}
                        onChange={() => toggleSelect(u.id)}
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {u.profile_pic ? (
                          <img
                            src={u.profile_pic}
                            className="w-9 h-9 rounded-full object-cover"
                            alt=""
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold text-sm">
                            {(u.display_name || u.username || "?").charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                            {u.display_name || u.username}
                            {u.is_okmade && <span className="ml-1 text-amber-500">✓</span>}
                          </p>
                          <p className="text-xs text-gray-400">@{u.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-600 dark:text-gray-400">
                      <p className="truncate max-w-[160px]">{u.email || "—"}</p>
                      <p>{u.phone_number || "—"}</p>
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-600 dark:text-gray-400">
                      {u.skill || "—"}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1">
                        {u.is_okmade && (
                          <span className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 px-2 py-0.5 rounded-full w-fit">
                            OKMADE
                          </span>
                        )}
                        {u.verified && !u.is_okmade && (
                          <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-0.5 rounded-full w-fit">
                            Verified
                          </span>
                        )}
                        {u.suspended && (
                          <span className="text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 px-2 py-0.5 rounded-full w-fit">
                            Suspended
                          </span>
                        )}
                        {!u.is_okmade && !u.verified && !u.suspended && (
                          <span className="text-xs text-gray-400">Normal</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-500 dark:text-gray-400">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex gap-2 justify-end flex-wrap">
                        <a
                          href={`/client/${u.username}`}
                          target="_blank"
                          className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600"
                        >
                          View
                        </a>
                        <button
                          onClick={() => setNotifyUser(u)}
                          className="bg-purple-500 text-white px-3 py-1 rounded text-xs hover:bg-purple-600"
                        >
                          Notify
                        </button>
                        {!u.is_okmade && (
                          <>
                            <button
                              onClick={() => updateUser(u.id, { verified: !u.verified })}
                              disabled={busy}
                              className={`text-xs px-3 py-1 rounded ${
                                u.verified
                                  ? "bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                                  : "bg-green-500 text-white hover:bg-green-600"
                              } disabled:opacity-50`}
                            >
                              {u.verified ? "Unverify" : "Verify"}
                            </button>
                            <button
                              onClick={() => updateUser(u.id, { suspended: !u.suspended })}
                              disabled={busy}
                              className={`text-xs px-3 py-1 rounded ${
                                u.suspended
                                  ? "bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                                  : "bg-red-500 text-white hover:bg-red-600"
                              } disabled:opacity-50`}
                            >
                              {u.suspended ? "Unsuspend" : "Suspend"}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 disabled:opacity-40"
              >
                ← Prev
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      {notifyUser && (
        <div
          className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4"
          onClick={() => setNotifyUser(null)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">
              Notify {notifyUser.display_name || notifyUser.username}
            </h3>
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Message
                </label>
                <textarea
                  value={notifyMessage}
                  onChange={(e) => setNotifyMessage(e.target.value)}
                  rows="3"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                  placeholder="Type the message..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Link (optional)
                </label>
                <input
                  type="text"
                  value={notifyUrl}
                  onChange={(e) => setNotifyUrl(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                  placeholder="/client/dashboard"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setNotifyUser(null)}
                className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium py-2.5 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={sendNotify}
                disabled={busy || !notifyMessage.trim()}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-medium py-2.5 rounded-lg disabled:opacity-50"
              >
                {busy ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
