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
   
