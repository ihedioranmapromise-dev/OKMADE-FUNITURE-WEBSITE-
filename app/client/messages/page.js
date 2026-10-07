"use client";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createSupabaseBrowser } from "@/lib/supabase-browser";

const BLUR = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxIDEiPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNmZWYzYzciLz48L3N2Zz4=";

export default function MessagesListPage() {
  const [threads, setThreads] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("inbox");
  const [me, setMe] = useState(null);
  const router = useRouter();
  const supabase = createSupabaseBrowser();

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/client/login"); return; }
    const { data: myClient } = await supabase
      .from("clients")
      .select("id")
      .eq("auth_id", user.id)
      .maybeSingle();
    setMe(myClient || null);

    const [threadsRes, requestsRes] = await Promise.all([
      fetch("/api/messages"),
      fetch("/api/messages/requests"),
    ]);

    if (threadsRes.status === 401) { router.push("/client/login"); return; }
    if (threadsRes.ok) {
      const data = await threadsRes.json();
      setThreads(Array.isArray(data) ? data : []);
    }
    if (requestsRes.ok) {
      setRequests(await requestsRes.json());
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const isPinned = (t) => me && Array.isArray(t.pinned_by) && t.pinned_by.includes(me.id);
  const isArchived = (t) => me && Array.isArray(t.archived_by) && t.archived_by.includes(me.id);
  const isDeleted = (t) => me && Array.isArray(t.deleted_by) && t.deleted_by.includes(me.id);

  const visibleThreads = useMemo(() => {
    let list = threads.filter((t) => !isDeleted(t));
    if (tab === "inbox") list = list.filter((t) => !isArchived(t));
    else if (tab === "archived") list = list.filter((t) => isArchived(t));
    else if (tab === "pinned") list = list.filter((t) => isPinned(t));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((t) =>
        (t.other?.display_name || "").toLowerCase().includes(q) ||
        (t.other?.username || "").toLowerCase().includes(q) ||
        (t.group_name || "").toLowerCase().includes(q) ||
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
    load();
  };

  const respondRequest = async (requestId, action) => {
    const res = await fetch("/api/messages/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ request_id: requestId, action }),
    });
    const data = await res.json();
    if (res.ok && action === "accept" && data.thread_id) {
      router.push(`/client/messages/${data.thread_id}`);
      return;
    }
    load();
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
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            Messages
          </h1>
          <a
            href="/client/messages/new-group"
            className="bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold px-3 py-2 rounded-lg transition"
          >
            + New Group
          </a>
        </div>

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

        <div className="flex gap-1 mb-4 overflow-x-auto">
          {[
            { id: "inbox", label: "Inbox" },
            { id: "pinned", label: "Pinned" },
            { id: "archived", label: "Archived" },
            { id: "requests", label: `Requests${requests.length ? ` (${requests.length})` : ""}` },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3 py-2 text-sm font-medium rounded-lg whitespace-nowrap ${
                tab === t.id
                  ? "bg-amber-600 text-white"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "requests" && (
          <>
            {requests.length === 0 ? (
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-8 text-center text-gray-500 dark:text-gray-400">
                No message requests.
              </div>
            ) : (
              <div className="space-y-2">
                {requests.map((r) => (
                  <div
                    key={r.id}
                    className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-4"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      {r.from?.profile_pic ? (
                        <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                          <Image src={r.from.profile_pic} alt="" fill sizes="40px" className="object-cover" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-700 dark:text-amber-300 font-bold">
                          {(r.from?.display_name || "?").charAt(0)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 dark:text-gray-200 truncate">
                          {r.from?.display_name || r.from?.username}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          @{r.from?.username}
                        </p>
                      </div>
                    </div>
                    {r.first_message && (
                      <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-3">
                        {r.first_message}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => respondRequest(r.id, "accept")}
                        className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 rounded-lg text-sm"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => respondRequest(r.id, "decline")}
                        className="flex-1 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium py-2 rounded-lg text-sm"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab !== "requests" && (
          <>
            {visibleThreads.length === 0 ? (
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-8 text-center text-gray-500 dark:text-gray-400">
                {search
                  ? "No conversations match your search."
                  : tab === "pinned"
                  ? "No pinned conversations."
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
                      {t.is_group ? (
                        <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-700 dark:text-amber-300 font-bold flex-shrink-0">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                      ) : t.other?.profile_pic ? (
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
                            {t.is_group ? t.group_name || "Group" : t.other?.display_name || t.other?.username}
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
                      >
                        {isPinned(t) ? "Unpin" : "Pin"}
                      </button>
                      <button
                        onClick={() => threadAction(t, isArchived(t) ? "unarchive" : "archive")}
                        className="text-xs text-gray-500 dark:text-gray-400 hover:text-amber-600 px-2 py-1"
                      >
                        {isArchived(t) ? "Restore" : "Archive"}
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("Delete this conversation from your view?")) {
                            threadAction(t, "delete_for_me");
                          }
                        }}
                        className="text-xs text-red-500 hover:text-red-700 px-2 py-1"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
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
