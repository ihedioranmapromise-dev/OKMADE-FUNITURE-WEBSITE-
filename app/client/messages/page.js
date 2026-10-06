"use client";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createSupabaseBrowser } from "@/lib/supabase-browser";

const BLUR = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxIDEiPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNmZWYzYzciLz48L3N2Zz4=";

export default function MessagesListPage() {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("inbox");
  const [me, setMe] = useState(null);
  const router = useRouter();
  const supabase = createSupabaseBrowser();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/client/login"); return; }
      const { data: myClient } = await supabase
        .from("clients")
        .select("id")
        .eq("auth_id", user.id)
        .maybeSingle();
      setMe(myClient || null);

      const res = await fetch("/api/messages");
      if (res.status === 401) { router.push("/client/login"); return; }
      if (res.ok) {
        const data = await res.json();
        setThreads(Array.isArray(data) ? data : []);
      }
      setLoading(false);
    }
    load();
  }, []);

  const isPinned = (t) => me && Array.isArray(t.pinned_by) && t.pinned_by.includes(me.id);
  const isArchived = (t) => me && Array.isArray(t.archived_by) && t.archived_by.includes(me.id);

  const visibleThreads = useMemo(() => {
    let list = threads;
    if (tab === "inbox") list = list.filter((t) => !isArchived(t));
    else if (tab === "archived") list = list.filter((t) => isArchived(t));
    else if (tab === "pinned") list = list.filter((t) => isPinned(t));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((t) =>
        (t.other?.display_name || "").toLowerCase().includes(q) ||
        (t.other?.username || "").toLowerCase().includes(q) ||
        (t.last_message_preview || "").toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => {
      const ap = isPinned(a) ? 1 : 0;
      const bp = isPinned(b) ? 1 : 0;
      if (ap !== bp) return bp - ap;
      return new Date(b.last_message_at || b.created_at || 0) - new Date(a.last_message_at || a.created_at || 0);
    });
  }, [threads, tab, search, me]);

  const threadAction = async (thread, action) => {
    await fetch("/api/messages/thread-action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ thread_id: thread.id, action }),
    });
    const res = await fetch("/api/messages");
    if (res.ok) setThreads(await res.json());
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="h-8 w-40 bg-gray-200 dark:bg-gray-800 rounded animate-pulse mb-6"></div>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-4">
                <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/3 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-2/3 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
          Messages
        </h1>

        <div className="relative mb-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="w-full p-3 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-amber-500"
          />
          <svg className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div className="flex gap-1 mb-4">
          {[
            { id: "inbox", label: "Inbox" },
            { id: "pinned", label: "Pinned" },
            { id: "archived", label: "Archived" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg ${
                tab === t.id
                  ? "bg-amber-600 text-white"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {visibleThreads.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-8 text-center text-gray-500 dark:text-gray-400">
            {search
              ? "No conversations match your search."
              : tab === "pinned"
              ? "No pinned conversations. Pin one to keep it at the top."
              : tab === "archived"
              ? "No archived conversations."
              : "No conversations yet."}
          </div>
        ) : (
          <div className="space-y-2">
            {visibleThreads.map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-3 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
              >
                <a
                  href={`/client/messages/${t.id}`}
                  className="flex items-center gap-3 flex-1 p-4 min-w-0"
                >
                  {t.other?.profile_pic ? (
                    <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                      <Image
                        src={t.other.profile_pic}
                        alt=""
                        fill
                        sizes="48px"
                        className="object-cover"
                        placeholder="blur"
                        blurDataURL={BLUR}
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-700 dark:text-amber-300 font-bold flex-shrink-0">
                      {(t.other?.display_name || "?").charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center gap-2">
                      <p className="font-semibold text-gray-800 dark:text-gray-200 truncate flex items-center gap-1">
                        {isPinned(t) && <span className="text-amber-500 text-xs">📌</span>}
                        {t.other?.display_name || t.other?.username}
                      </p>
                      {t.unread > 0 && (
                        <span className="bg-amber-600 text-white text-xs rounded-full px-2 py-0.5 flex-shrink-0">
                          {t.unread}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                      {t.last_message_preview || "Start a conversation"}
                    </p>
                  </div>
                </a>
                <div className="flex flex-col gap-1 pr-3">
                  <button
                    onClick={() => threadAction(t, isPinned(t) ? "unpin" : "pin")}
                    className="text-xs text-gray-500 dark:text-gray-400 hover:text-amber-600 px-2 py-1"
                    title={isPinned(t) ? "Unpin" : "Pin"}
                  >
                    {isPinned(t) ? "Unpin" : "Pin"}
                  </button>
                  <button
                    onClick={() => threadAction(t, isArchived(t) ? "unarchive" : "archive")}
                    className="text-xs text-gray-500 dark:text-gray-400 hover:text-amber-600 px-2 py-1"
                    title={isArchived(t) ? "Unarchive" : "Archive"}
                  >
                    {isArchived(t) ? "Restore" : "Archive"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <a
          href="/client/dashboard"
          className="inline-block mt-6 text-sm text-amber-600 dark:text-amber-400 hover:underline"
        >
          ← Back to Dashboard
        </a>
      </div>
    </div>
  );
}
