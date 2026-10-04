"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import { fetchWithRetry } from "@/lib/fetch-with-retry";
import { enqueue } from "@/lib/offline-queue";

const BLUR = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxIDEiPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNmZWYzYzciLz48L3N2Zz4=";

export default function ThreadPage() {
  const { threadId } = useParams();
  const [data, setData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [localMessage, setLocalMessage] = useState("");
  const bottomRef = useRef(null);
  const router = useRouter();
  const supabase = createSupabaseBrowser();

  useEffect(() => {
    loadThread();
  }, [threadId]);

  useEffect(() => {
    const interval = setInterval(loadThread, 5000);
    return () => clearInterval(interval);
  }, [threadId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadThread() {
    try {
      const res = await fetchWithRetry(`/api/messages/${threadId}`, {}, { retries: 1 });
      if (res.status === 401) {
        router.push("/client/login");
        return;
      }
      if (res.status === 404 || res.status === 403) {
        router.push("/client/messages");
        return;
      }
      if (res.ok) {
        const d = await res.json();
        setData(d);
        setMessages(d.messages || []);
      }
    } catch {}
    setLoading(false);
  }

  async function sendMessage(e) {
    e.preventDefault();
    if (!content.trim() || sending) return;
    const text = content;
    setContent("");
    setSending(true);

    const tempId = `temp_${Date.now()}`;
    const tempMsg = {
      id: tempId,
      sender_id: data?.my_id,
      content: text,
      created_at: new Date().toISOString(),
      pending: true,
    };
    setMessages((prev) => [...prev, tempMsg]);

    if (!navigator.onLine) {
      enqueue({
        url: `/api/messages/${threadId}`,
        method: "POST",
        body: { content: text },
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
        body: JSON.stringify({ content: text }),
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
        body: { content: text },
        label: "Message",
      });
      setLocalMessage("Message saved. Will send automatically.");
      setTimeout(() => setLocalMessage(""), 4000);
    } finally {
      setSending(false);
    }
  }

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
            {other?.skill && (
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{other.skill}</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-3">
          {messages.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 text-sm py-8">
              No messages yet. Say hello 👋
            </p>
          ) : (
            messages.map((m) => {
              const mine = m.sender_id === data.my_id;
              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                      mine
                        ? "bg-amber-600 text-white"
                        : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-200"
                    } ${m.pending ? "opacity-70" : ""}`}
                  >
                    <p className="text-sm break-words whitespace-pre-wrap">{m.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        mine ? "text-amber-100" : "text-gray-400"
                      }`}
                    >
                      {m.pending
                        ? "Sending..."
                        : new Date(m.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                      {mine && m.read_at && !m.pending && " · Read"}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {localMessage && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border-t border-amber-100 dark:border-amber-800 text-xs text-amber-700 dark:text-amber-300 text-center py-1.5">
          {localMessage}
        </div>
      )}

      <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        <form onSubmit={sendMessage} className="max-w-2xl mx-auto px-4 py-3 flex gap-2">
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 p-3 border border-gray-300 dark:border-gray-700 rounded-full text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={sending || !content.trim()}
            className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-3 rounded-full font-semibold text-sm disabled:opacity-50 transition"
          >
            Send
          </button>
        </form
