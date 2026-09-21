"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function MessagesListPage() {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/messages").then((r) => {
      if (r.status === 401) { router.push("/client/login"); return []; }
      return r.json();
    }).then((data) => {
      setThreads(Array.isArray(data) ? data : []);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-amber-600">Loading messages...</div>;

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Messages</h1>

        {threads.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
            <p>No conversations yet.</p>
            <p className="text-sm mt-2">Become friends with another artisan, then open their profile to start a chat.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {threads.map((t) => (
              <a
                key={t.id}
                href={`/client/messages/${t.id}`}
                className="flex items-center gap-3 bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:bg-gray-50 transition"
              >
                {t.other?.profile_pic ? (
                  <img src={t.other.profile_pic} className="w-12 h-12 rounded-full object-cover" alt="" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold">
                    {(t.other?.display_name || "?").charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center gap-2">
                    <p className="font-semibold text-gray-800 truncate">
                      {t.other?.display_name || t.other?.username}
                    </p>
                    {t.unread > 0 && (
                      <span className="bg-amber-600 text-white text-xs rounded-full px-2 py-0.5">
                        {t.unread}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-1">
                    {t.last_message_preview || "Start a conversation"}
                  </p>
                </div>
              </a>
            ))}
          </div>
        )}

        <a href="/client/dashboard" className="inline-block mt-6 text-sm text-amber-600 hover:underline">
          ← Back to Dashboard
        </a>
      </div>
    </div>
  );
}
