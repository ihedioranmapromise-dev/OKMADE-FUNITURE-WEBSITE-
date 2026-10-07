"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import { fetchWithRetry } from "@/lib/fetch-with-retry";
import { enqueue } from "@/lib/offline-queue";

const BLUR = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxIDEiPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNmZWYzYzciLz48L3N2Zz4=";

const CloseIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

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
      created_at: new Date().toISOString(),
      pending: true,
    };
    setMessages((prev) => [...prev, tempMsg]);

    if (!navigator.onLine) {
      enqueue({
        url: `/api/messages/${threadId}`,
        method: "POST",
        body: { content: text, image_url: imageUrl },
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
        body: JSON.stringify({ content: text, image_url: imageUrl }),
      });
      if (res.ok) {
        const newMsg = await res.json();
        setMessages((prev) => prev.map((m) => (m.id === tempId ? newMsg : m)));
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
        body: { content: text, image_url: imageUrl },
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
    const data = await res.json();
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
      setReportMsg("Error: " + (data.error || "Failed"));
    }
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
  const messagesWithUnreadMarker = [...messages];
  const firstUnreadId =
    hasScrolledToUnread.current
      ? null
      : messagesWithUnreadMarker.find(
          (m) => m.receiver_id === data.my_id && !m.read_at && !m.pending
        )?.id;

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
              className="font-semibold text-gray-800 dark:text-gray-200 text-sm hover:underline truncate block"
            >
              {other?.display_name || other?.username}
            </a>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {otherTyping ? "typing..." : other?.skill || ""}
            </p>
          </div>
        </div>
      </div>

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
              return (
                <div key={m.id}>
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
                      </div>
                      {!m.pending && !m.deleted && (
                        <button
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
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {menuFor && (
        <div className="fixed inset-0 z-[90]" onClick={() => setMenuFor(null)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-2xl p-4 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const m = messages.find((x) => x.id === menuFor);
              if (!m) return null;
              const mine = m.sender_id === data.my_id;
              return (
                <div className="space-y-2">
                  {mine ? (
                    <button
                      onClick={() => handleDelete(m.id)}
                      className="w-full text-left px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg font-medium"
                    >
                      Delete message
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setReportFor(m);
                        setMenuFor(null);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg font-medium"
                    >
                      Report message
                    </button>
                  )}
                  <button
                    onClick={() => setMenuFor(null)}
                    className="w-full text-center px-4 py-3 text-gray-600 dark:text-gray-400 rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {reportFor && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4" onClick={() => setReportFor(null)}>
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-3">
              Report message
            </h3>
            <div className="space-y-2 mb-3">
              {[
                "Spam or scam",
                "Harassment",
                "Inappropriate content",
                "Other",
              ].map((r) => (
                <label
                  key={r}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm ${
                    reportReason === r
                      ? "bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700"
                      : "bg-gray-50 dark:bg-gray-800"
                  }`}
                >
                  <input
                    type="radio"
                    checked={reportReason === r}
                    onChange={() => setReportReason(r)}
                  />
                  {r}
                </label>
              ))}
            </div>
            <textarea
              value={reportDetails}
              onChange={(e) => setReportDetails(e.target.value)}
              rows="2"
              placeholder="Details (optional)"
              className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 mb-3"
            />
            {reportMsg && (
              <p
                className={`text-sm mb-3 ${
                  reportMsg.includes("Error") ? "text-red-500" : "text-green-600 dark:text-green-400"
                }`}
              >
                {reportMsg}
              </p>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => setReportFor(null)}
                className="flex-1 bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-medium py-2.5 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleReport}
                disabled={reportSending || !reportReason}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 rounded-lg disabled:opacity-50"
              >
                {reportSending ? "..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {localMessage && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border-t border-amber-100 dark:border-amber-800 text-xs text-amber-700 dark:text-amber-300 text-center py-1.5">
          {localMessage}
        </div>
      )}

      <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        <form onSubmit={handleFormSubmit} className="max-w-2xl mx-auto px-4 py-3 flex gap-2 items-center">
          <label className="cursor-pointer p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition text-gray-600 dark:text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageSelect}
              disabled={uploading}
            />
          </label>
          <input
            type="text"
            value={content}
            onChange={handleContentChange}
            placeholder={uploading ? "Uploading image..." : "Type a message..."}
            className="flex-1 p-3 border border-gray-300 dark:border-gray-700 rounded-full text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
            disabled={sending || uploading}
          />
          <button
            type="submit"
            disabled={sending || uploading || !content.trim()}
            className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-3 rounded-full font-semibold text-sm disabled:opacity-50 transition"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
