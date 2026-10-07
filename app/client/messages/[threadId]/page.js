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

    // Optimistic
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
          {other?.profile_pic ? (
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
            <a
              href={`/client/${other?.username}`}
              className="font-sem
