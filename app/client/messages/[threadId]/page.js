"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase-browser";

export default function ThreadPage() {
  const { threadId } = useParams();
  const [data, setData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);
  const router = useRouter();
  const supabase = createSupabaseBrowser();

  useEffect(() => {
    loadThread();
  }, [threadId]);

  useEffect(() => {
    // Poll every 5 seconds for new messages
    const interval = setInterval(loadThread, 5000);
    return () => clearInterval(interval);
  }, [threadId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadThread() {
    const res = await fetch(`/api/messages/${threadId}`);
    if (res.status === 401) { router.push("/client/login"); return; }
    if (res.status === 404 || res.status === 403) { router.push("/client/messages"); return; }
    if (res.ok) {
      const d = await res.json();
      setData(d);
      setMessages(d.messages || []);
    }
    setLoading(false);
  }

  async function sendMessage(e) {
    e.preventDefault();
    if (!content.trim() || sending) return;
    setSending(true);
    const res = await fetch(`/api/messages/${threadId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    if (res.ok) {
      const newMsg = await res.json();
      setMessages((prev) => [...prev, newMsg]);
      setContent("");
    }
    setSending(false);
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-amber-600">Loading chat...</div>;
  if (!data) return null;

  const other = data.other;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => router.push("/client/messages")} className="text-gray-600 hover:text-amber-700 text-xl">
            ←
          </button>
          {other?.profile_pic ? (
            <img src={other.profile_pic} className="w-9 h-9 rounded-full object-cover" alt="" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm">
              {(other?.display_name || "?").charAt(0)}
            </div>
          )}
          <div className="flex-1">
            <a href={`/client/${other?.username}`} className="font-semibold text-gray-800 text-sm hover:underline">
              {other?.display_name || other?.username}
            </a>
            {other?.skill && <p className="text-xs text-gray-500">{other.skill}</p>}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-3">
          {messages.length === 0 ? (
            <p className="text-center text-gray-500 text-sm py-8">
              No messages yet. Say hello 👋
            </p>
          ) : (
            messages.map((m) => {
              const mine = m.sender_id === data.my_id;
              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${mine ? "bg-amber-600 text-white" : "bg-white border border-gray-200 text-gray-800"}`}>
                    <p className="text-sm break-words whitespace-pre-wrap">{m.content}</p>
                    <p className={`text-xs mt-1 ${mine ? "text-amber-100" : "text-gray-400"}`}>
                      {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      {mine && m.read_at && " · Read"}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Composer */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200">
        <form onSubmit={sendMessage} className="max-w-2xl mx-auto px-4 py-3 flex gap-2">
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 p-3 border rounded-full text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={sending || !content.trim()}
            className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-3 rounded-full font-semibold text-sm disabled:opacity-50 transition"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
