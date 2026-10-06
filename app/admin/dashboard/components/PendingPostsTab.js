"use client";
import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-client";

export default function PendingPostsTab() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const res = await adminFetch("/api/admin/pending-posts");
    if (res.ok) setPosts(await res.json());
    setLoading(false);
  }

  const approve = async (id) => {
    const res = await adminFetch("/api/admin/pending-posts", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "approve" }),
    });
    if (res.ok) {
      setPosts((prev) => prev.filter((p) => p.id !== id));
      setMessage("Post approved.");
    }
  };

  const reject = async (id) => {
    if (!confirm("Delete this pending post permanently?")) return;
    const res = await adminFetch("/api/admin/pending-posts", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "reject" }),
    });
    if (res.ok) {
      setPosts((prev) => prev.filter((p) => p.id !== id));
      setMessage("Post rejected and deleted.");
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
        Pending Posts
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Posts from new users that need your approval before appearing on the feed.
      </p>

      {message && <p className="text-sm text-green-600 dark:text-green-400 mb-3">{message}</p>}

      {posts.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center text-gray-500 dark:text-gray-400">
          No pending posts. All clear.
        </div>
      )
