"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import { fetchWithRetry } from "@/lib/fetch-with-retry";
import { enqueue } from "@/lib/offline-queue";

const BLUR = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxIDEiPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNmZWYzYzciLz48L3N2Zz4=";

const REACTIONS = [
  { type: "like", emoji: "👍" },
  { type: "love", emoji: "❤️" },
  { type: "haha", emoji: "😂" },
  { type: "wow", emoji: "😮" },
  { type: "sad", emoji: "😢" },
  { type: "angry", emoji: "😡" },
];

const DISAPPEAR_OPTIONS = [
  { label: "Off", value: null },
  { label: "1 hour", value: 3600 },
  { label: "24 hours", value: 86400 },
  { label: "7 days", value: 604800 },
];

async function uploadChatImage(supabase, userId, file) {
  const ext = file.name.split(".").pop();
  const path = `chat/${userId}_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  for (let i = 0; i < 3; i++) {
    const { error } = await supabase.storage
      .from("story-images")
      .upload(path, file, { cacheControl: "31536000", upsert: true });
    if (!error) {
      const { data } = supabase.storage.from("story-images").getPublicUrl(path);
      return data.publicUrl;
    }
    await new Promise((r) => setTimeout(r, 500 * Math.pow(2, i)));
  }
  throw new Error("Upload failed");
}

export default function ThreadPage() {
  const { threadId } = useParams();
  const [data, setData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [localMessage, setLocalMessage] = useState("");
  const [otherTyping, setOtherTyping] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const [menuFor, setMenuFor] = useState(null);
  const [reportFor, setReportFor] = useState(null);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [reportSending, setReportSending] = useState(false);
  const [reportMsg, setReportMsg] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [reactFor, setReactFor] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [confirmBlock, setConfirmBlock] = useState(false);
  const [disappearMenuOpen, setDisappearMenuOpen] = useState(false);
  const [pinnedMessage, setPinnedMessage] = useState(null);
  const bottomRef = useRef(null);
  const firstUnreadRef = useRef(null);
  const hasScrolledToUnread = useRef(false);
  const typingCooldown = useRef(0);
  const router = useRouter();
  const supabase = createSupabaseBrowser();

  const loadThread = async (markRead = false) => {
    try {
      const url = markRead
        ? `/api/messages/${threadId}?mark_read=1`
        : `/api/messages/${threadId}`;
      const res = await fetchWithRetry(url, {}, { retries: 1 });
      if (res.status === 401) { router.push("/client/login"); return; }
      if (res.status === 404 || res.status === 403) { router.push("/client/messages"); return; }
      if (res.ok) {
        const d = await res.json();
        setData(d);
        setMessages(d.messages || []);
      }
    } catch {}
  };

  const checkTyping = async () => {
    try {
      const res = await fetch(`/api/messages/typing?thread_id=${threadId}`);
      if (res.ok) {
        const d = await res.json();
        setOtherTyping(!!d.typing);
      }
    } catch {}
  };

  useEffect(() => {
    loadThread(false).then(() => setLoading(false));
  }, [threadId]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadThread(document.hasFocus());
    }, 5000);
    return () => clearInterval(interval);
  }, [threadId]);

  useEffect(() => {
    const interval = setInterval(checkTyping, 2500);
    return () => clearInterval(interval);
  }, [threadId]);

  useEffect(() => {
    if (!hasScrolledToUnread.current && messages.length > 0 && data?.my_id) {
      const firstUnread = messages.find(
        (m) => m.receiver_id === data.my_id && !m.read_at && !m.pending
      );
      if (firstUnread && firstUnreadRef.current) {
        firstUnreadRef.current.scrollIntoView({ block: "center" });
        hasScrolledToUnread.current = true;
        return;
      }
      hasScrolledToUnread.current = true;
    }
    if (hasScrolledToUnread.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, data]);

  useEffect(() => {
    if (!data || !data.thread || !data.messages) return;
    const pid = data.thread.pinned_message_id;
    if (pid) {
      const found = data.messages.find((m) => m.id === pid);
      setPinnedMessage(found || null);
    } else {
      setPinnedMessage(null);
    }
  }, [data]);

  useEffect(() => {
    if (!data?.thread?.is_group) {
      setMembers([]);
      return;
    }
    fetch(`/api/messages/group-list?thread_id=${threadId}`)
      .then((r) => (r.ok ? r.json() : { members: [] }))
      .then((d) => setMembers(d.members || []))
      .catch(() => {});
  }, [data?.thread?.is_group, threadId]);

  const notifyTyping = async () => {
    const now = Date.now();
    if (now - typingCooldown.current < 1500) return;
    typingCooldown.current = now;
    try {
      await fetch("/api/messages/typing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ thread_id: threadId }),
      });
    } catch {}
  };

  const handleContentChange = (e) => {
    setContent(e.target.value);
    notifyTyping();
  };

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!navigator.onLine) {
      setLocalMessage("Cannot send images while offline.");
      setTimeout(() => setLocalMessage(""), 4000);
      return;
    }
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const url = await uploadChatImage(supabase, user.id, file);
      await sendMessage({ imageUrl: url });
    } catch (err) {
      setLocalMessage("Error: " + err.message);
      setTimeout(() => setLocalMessage(""), 4000);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const sendMessage = async ({ imageUrl = null } = {}) => {
    const text = content.trim();
    if (!text && !imageUrl) return;
    if (sending) return;

    setContent("");
    setSending(true);

    const tempId = `temp_${Date.now()}`;
    const tempMsg = {
      id: tempId,
      sender_id: data?.my_id,
      receiver_id: null,
      content: text,
      image_url: imageUrl,
      reply_to_id: replyTo?.id || null,
      reply_to: replyTo || null,
      reactions: [],
      created_at: new Date().toISOString(),
      pending: true,
    };
    setMessages((prev) => [...prev, tempMsg]);
    setReplyTo(null);

    if (!navigator.onLine) {
      enqueue({
        url: `/api/messages/${threadId}`,
        method: "POST",
        body: { content: text, image_url: imageUrl, reply_to_id: tempMsg.reply_to_id },
        label: "Message",
      });
      setLocalMessage("Will send when you're back online.");
      setTimeout(() => setLocalMessage(""), 4000);
      setSending(false);
      return;
    }

    try {
      const res = await fetchWithRetry(`/api/messages/${threadId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: text,
          image_url: imageUrl,
          reply_to_id: tempMsg.reply_to_id,
        }),
      });
      if (res.ok) {
        const newMsg = await res.json();
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId ? { ...newMsg, reply_to: replyTo || null, reactions: [] } : m
          )
        );
      } else {
        throw new Error();
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, pending: true } : m))
      );
      enqueue({
        url: `/api/messages/${threadId}`,
        method: "POST",
        body: { content: text, image_url: imageUrl, reply_to_id: tempMsg.reply_to_id },
        label: "Message",
      });
      setLocalMessage("Message saved. Will send automatically.");
      setTimeout(() => setLocalMessage(""), 4000);
    } finally {
      setSending(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    sendMessage();
  };

  const handleDelete = async (messageId) => {
    if (!confirm("Delete this message?")) return;
    setMenuFor(null);
    const res = await fetch("/api/messages/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message_id: messageId }),
    });
    if (res.ok) {
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, deleted: true, content: "" } : m))
      );
    }
  };

  const handleReact = async (messageId, reactionType) => {
    setReactFor(null);
    setMenuFor(null);

    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageId) return m;
        const existing = (m.reactions || []).filter((r) => r.user_id !== data.my_id);
        const myOld = (m.reactions || []).find((r) => r.user_id === data.my_id);
        if (myOld?.reaction_type === reactionType) {
          return { ...m, reactions: existing };
        }
        return {
          ...m,
          reactions: [...existing, { user_id: data.my_id, reaction_type: reactionType }],
        };
      })
    );

    try {
      await fetch("/api/messages/react", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message_id: messageId, reaction_type: reactionType }),
      });
    } catch {}
  };

  const handleReport = async () => {
    if (!reportReason) {
      setReportMsg("Pick a reason");
      return;
    }
    setReportSending(true);
    setReportMsg("");
    const res = await fetch("/api/messages/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message_id: reportFor.id,
        reason: reportReason,
        details: reportDetails.trim() || null,
      }),
    });
    const respData = await res.json();
    setReportSending(false);
    if (res.ok) {
      setReportMsg("Report submitted.");
      setTimeout(() => {
        setReportFor(null);
        setReportReason("");
        setReportDetails("");
        setReportMsg("");
      }, 1200);
    } else {
      setReportMsg("Error: " + (respData.error || "Failed"));
    }
  };

  const handleBlock = async () => {
    setConfirmBlock(false);
    const res = await fetch("/api/messages/block", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ thread_id: threadId, action: "block" }),
    });
    if (res.ok) {
      router.push("/client/messages");
    }
  };

  const pinMessage = async (messageId) => {
    await fetch("/api/messages/thread-action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ thread_id: threadId, action: "pin_message", message_id: messageId }),
    });
    setMenuFor(null);
    loadThread(false);
  };

  const unpinMessage = async () => {
    await fetch("/api/messages/thread-action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ thread_id: threadId, action: "unpin_message" }),
    });
    setPinnedMessage(null);
  };

  const setDisappearMode = async (seconds) => {
    await fetch("/api/messages/thread-action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        thread_id: threadId,
        action: seconds ? "disappear_on" : "disappear_off",
        seconds,
      }),
    });
    setDisappearMenuOpen(false);
    loadThread(false);
  };

  const runSearch = async (q) => {
    setSearchQuery(q);
    if (q.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(
        `/api/messages/search-thread?thread_id=${threadId}&q=${encodeURIComponent(q.trim())}`
      );
      if (res.ok) setSearchResults(await res.json());
    } catch {}
    setSearching(false);
  };

  const jumpToMessage = (id) => {
    const el = document.getElementById(`msg-${id}`);
    if (el) {
      el.scrollIntoView({ block: "center", behavior: "smooth" });
      el.classList.add("bg-amber-100", "dark:bg-amber-900/40");
      setTimeout(() => el.classList.remove("bg-amber-100", "dark:bg-amber-900/40"), 1500);
    }
    setSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  const getStatusIcon = (m) => {
    if (!m.sender_id || m.sender_id !== data?.my_id) return null;
    if (m.pending) return "Sending…";
    if (m.read_at) return "✓✓ Seen";
    if (m.delivered_at) return "✓✓ Delivered";
    return "✓ Sent";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex flex-col">
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
            <div className="w-6 h-6"></div>
            <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/3 animate-pulse"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/4 animate-pulse"></div>
            </div>
          </div>
        </div>
        <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className={`flex ${i % 2 ? "justify-end" : "justify-start"}`}>
              <div className="h-12 w-40 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (!data) return null;

  const other = data.other;
  const isGroup = !!data.thread?.is_group;
  const firstUnreadId = hasScrolledToUnread.current
    ? null
    : messages.find((m) => m.receiver_id === data.my_id && !m.read_at && !m.pending)?.id;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex flex-col">
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => router.push("/client/messages")}
            className="text-gray-600 dark:text-gray-300 hover:text-amber-700 dark:hover:text-amber-400 text-xl"
          >
            ←
          </button>
          {isGroup ? (
            <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-700 dark:text-amber-300 font-bold text-sm flex-shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          ) : other?.profile_pic ? (
            <div className="relative w-9 h-9 rounded-full overflow-hidden flex-shrink-0">
              <Image
                src={other.profile_pic}
                alt=""
                fill
                sizes="36px"
                className="object-cover"
                placeholder="blur"
                blurDataURL={BLUR}
              />
            </div>
          ) : (
            <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-700 dark:text-amber-300 font-bold text-sm flex-shrink-0">
              {(other?.display_name || "?").charAt(0)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            {isGroup ? (
              <>
                <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm truncate">
                  {data.thread.group_name || "Group"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {members.length} member{members.length === 1 ? "" : "s"}
                </p>
              </>
            ) : (
              <>
                <a
                  href={`/client/${other?.username}`}
                  className="font-semibold text-gray-800 dark:text-gray-200 text-sm hover:underline truncate block"
                >
                  {other?.display_name || other?.username}
                </a>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {otherTyping ? "typing..." : other?.skill || ""}
                </p>
              </>
            )}
          </div>
          <button
            onClick={() => setDisappearMenuOpen(!disappearMenuOpen)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition text-gray-600 dark:text-gray-300"
            aria-label="Disappearing messages"
            title="Disappearing messages"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          <button
            onClick={() => setSearchOpen(true)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition text-gray-600 dark:text-gray-300"
            aria-label="Search in conversation"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
          {!isGroup && (
            <button
              onClick={() => setConfirmBlock(true)}
              className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400"
              aria-label="Block user"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {disappearMenuOpen && (
        <div className="sticky top-14 z-20 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-2xl mx-auto px-4 py-2 flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-500 dark:text-gray-400">Disappearing messages:</span>
            {DISAPPEAR_OPTIONS.map((o) => (
              <button
                key={o.label}
                onClick={() => setDisappearMode(o.value)}
                className={`text-xs px-3 py-1 rounded-full ${
                  (data.thread?.disappear_after_seconds || null) === o.value
                    ? "bg-amber-600 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {pinnedMessage && (
        <div className="bg-amber-100 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-800">
          <div className="max-w-2xl mx-auto px-4 py-2 flex items-center gap-2">
            <span className="text-amber-700 dark:text-amber-400 text-xs font-bold">📌 Pinned</span>
            <p className="text-xs text-gray-700 dark:text-gray-300 truncate flex-1">
              {pinnedMessage.content || "📷 Photo"}
            </p>
            <button
              onClick={() => jumpToMessage(pinnedMessage.id)}
              className="text-xs text-amber-700 dark:text-amber-400 hover:underline"
            >
              View
            </button>
            <button
              onClick={unpinMessage}
              className="text-xs text-amber-700 dark:text-amber-400 hover:underline"
            >
              Unpin
            </button>
          </div>
        </div>
      )}

      {searchOpen && (
        <div className="sticky top-14 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-2xl mx-auto px-4 py-3">
            <div className="relative">
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => runSearch(e.target.value)}
                placeholder="Search messages in this chat..."
                className="w-full p-3 pl-10 pr-10 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
              />
              <svg className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <button
                onClick={() => {
                  setSearchOpen(false);
                  setSearchQuery("");
                  setSearchResults([]);
                }}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            {searchQuery.trim().length >= 2 && (
              <div className="mt-2 max-h-64 overflow-y-auto">
                {searching ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 py-3 text-center">
                    Searching...
                  </p>
                ) : searchResults.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 py-3 text-center">
                    No matches.
                  </p>
                ) : (
                  <div className="space-y-1">
                    {searchResults.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => jumpToMessage(r.id)}
                        className="w-full text-left p-3 hover:bg-amber-50 dark:hover:bg-gray-800 rounded-lg transition"
                      >
                        <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                          {r.content}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(r.created_at).toLocaleString()}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {lightbox && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <img src={lightbox} alt="" className="max-w-full max-h-full object-contain" />
          <button
            className="absolute top-4 right-4 text-white text-3xl"
            onClick={() => setLightbox(null)}
          >
            ✕
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-3">
          {messages.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 text-sm py-8">
              No messages yet. Say hello 👋
            </p>
          ) : (
            messages.map((m) => {
              const mine = m.sender_id === data.my_id;
              const isFirstUnread = m.id === firstUnreadId;
              const reactionCounts = (m.reactions || []).reduce((acc, r) => {
                acc[r.reaction_type] = (acc[r.reaction_type] || 0) + 1;
                return acc;
              }, {});
              const myReaction = (m.reactions || []).find((r) => r.user_id === data.my_id);
              return (
                <div key={m.id} id={`msg-${m.id}`} className="transition">
                  {isFirstUnread && (
                    <div ref={firstUnreadRef} className="flex items-center gap-2 my-3">
                      <div className="flex-1 h-px bg-amber-300 dark:bg-amber-700" />
                      <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                        Unread
                      </span>
                      <div className="flex-1 h-px bg-amber-300 dark:bg-amber-700" />
                    </div>
                  )}
                  <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div className="relative max-w-[75%]">
                      {m.reply_to && (
                        <div
                          className={`text-xs px-3 py-1.5 mb-1 rounded-lg border-l-4 ${
                            mine
                              ? "bg-amber-700/30 border-amber-300 text-amber-100"
                              : "bg-gray-200 dark:bg-gray-800 border-amber-500 text-gray-600 dark:text-gray-400"
                          }`}
                        >
                          <p className="truncate">{m.reply_to.content}</p>
                        </div>
                      )}
                      <div
                        className={`rounded-2xl px-4 py-2 ${
                          mine
                            ? "bg-amber-600 text-white"
                            : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-200"
                        } ${m.pending ? "opacity-70" : ""} ${
                          m.deleted ? "italic opacity-60" : ""
                        }`}
                      >
                        {m.deleted ? (
                          <p className="text-sm">This message was deleted</p>
                        ) : (
                          <>
                            {m.image_url && (
                              <img
                                src={m.image_url}
                                alt=""
                                className="rounded-lg mb-2 max-h-64 object-cover cursor-pointer"
                                onClick={() => setLightbox(m.image_url)}
                              />
                            )}
                            {m.content && (
                              <p className="text-sm break-words whitespace-pre-wrap">
                                {m.content}
                              </p>
                            )}
                          </>
                        )}
                        <p
                          className={`text-xs mt-1 ${
                            mine ? "text-amber-100" : "text-gray-400"
                          }`}
                        >
                          {new Date(m.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {mine && !m.deleted && ` · ${getStatusIcon(m)}`}
                        </p>
                        {Object.keys(reactionCounts).length > 0 && (
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {Object.entries(reactionCounts).map(([type, count]) => {
                              const emoji = REACTIONS.find((r) => r.type === type)?.emoji;
                              return (
                                <span
                                  key={type}
                                  className={`text-xs px-1.5 py-0.5 rounded-full ${
                                    mine
                                      ? "bg-white/20"
                                      : "bg-gray-100 dark:bg-gray-800"
                                  }`}
                                >
                                  {emoji} {count > 1 && count}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      {!m.pending && !m.deleted && (
                        <button
                          onDoubleClick={() => setReactFor(m.id)}
                          onClick={() => setMenuFor(m.id)}
                          className={`absolute top-1 ${
                            mine ? "-left-8" : "-right-8"
                          } p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200`}
                          aria-label="Message options"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                          </svg>
                        </button>
                      )}
                      {myReaction && !m.deleted && (
                        <span
                          className={`absolute -bottom-1 ${
                            mine ? "left-1" : "right-1"
                          } text-xs bg-white dark:bg-gray-800 rounded-full w-5 h-5 flex items-center justify-center shadow`}
                        >
                          {REACTIONS.find((r) => r.type === myReaction.reaction_type)?.emoji}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {reactFor && (
        <div className="fixed inset-0 z-[90]" onClick={() => setReactFor(null)}>
          <div className="absolute inset-0 bg-black/20" />
          <div
            className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-900 rounded-full shadow-xl px-3 py-2 flex
