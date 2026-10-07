"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase-browser";

export default function NewGroupPage() {
  const [friends, setFriends] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [groupName, setGroupName] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  const supabase = createSupabaseBrowser();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/client/login"); return; }
      const { data: me } = await supabase
        .from("clients")
        .select("id")
        .eq("auth_id", user.id)
        .maybeSingle();
      if (!me) { router.push("/client/login"); return; }

      const { data: friendRows } = await supabase
        .from("friends")
        .select("user_a, user_b")
        .or(`user_a.eq.${me.id},user_b.eq.${me.id}`);

      const friendIds = (friendRows || []).map((f) =>
        f.user_a === me.id ? f.user_b : f.user_a
      );

      if (friendIds.length === 0) {
        setFriends([]);
        setLoading(false);
        return;
      }

      const { data: clients } = await supabase
        .from("clients")
        .select("username, display_name, profile_pic")
        .in("id", friendIds);

      setFriends(clients || []);
      setLoading(false);
    }
    load();
  }, []);

  const toggle = (username) => {
    const next = new Set(selected);
    if (next.has(username)) next.delete(username);
    else next.add(username);
    setSelected(next);
  };

  const create = async () => {
    if (!groupName.trim()) {
      setMessage("Group name required");
      return;
    }
    if (selected.size < 1) {
      setMessage("Pick at least 1 friend");
      return;
    }
    setCreating(true);
    setMessage("");
    const res = await fetch("/api/messages/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: groupName.trim(),
        usernames: Array.from(selected),
      }),
    });
    const data = await res.json();
    setCreating(false);
    if (res.ok && data.thread_id) {
      router.push(`/client/messages/${data.thread_id}`);
    } else {
      setMessage("Error: " + (data.error || "Failed"));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="h-8 w-40 bg-gray-200 dark:bg-gray-800 rounded animate-pulse mb-6"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">
          New Group
        </h1>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Group name
          </label>
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="e.g., Workshop Team"
            className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
          />
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 mb-6">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">
            Add friends ({selected.size} selected)
          </h2>
          {friends.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              You need friends first. Add friends from their profiles.
            </p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {friends.map((f) => (
                <label
                  key={f.username}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer ${
                    selected.has(f.username)
                      ? "bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700"
                      : "bg-gray-50 dark:bg-gray-800"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(f.username)}
                    onChange={() => toggle(f.username)}
                    className="w-4 h-4"
                  />
                  {f.profile_pic ? (
                    <img src={f.profile_pic} alt="" className="w-9 h-9 rounded-full object-cover" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-700 dark:text-amber-300 font-bold text-sm">
                      {(f.display_name || f.username).charAt(0)}
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    {f.display_name || f.username}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        {message && <p className="text-sm text-red-500 mb-4">{message}</p>}

        <button
          onClick={create}
          disabled={creating || !groupName.trim() || selected.size === 0}
          className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 rounded-lg disabled:opacity-50"
        >
          {creating ? "Creating..." : "Create Group"}
        </button>

        <a
          href="/client/messages"
          className="inline-block mt-6 text-sm text-amber-600 dark:text-amber-400 hover:underline"
        >
          ← Back to Messages
        </a>
      </div>
    </div>
  );
}
