"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const BLUR = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxIDEiPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNmZWYzYzciLz48L3N2Zz4=";

export default function MessagesListPage() {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/messages")
      .then((r) => {
        if (r.status === 401) {
          router.push("/client/login");
          return [];
        }
        return r.json();
      })
      .then((data) => {
        setThreads(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="h-8 w-40 bg-gray-200 dark:bg-gray-800 rounded animate-pulse mb-6"></div>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-4"
              >
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
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">
          Messages
        </h1>

        {threads.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-8 text-center text-gray-500 dark:text-gray-400">
            <p>No conversations yet.</p>
            <p className="text-sm mt-2">
              Become friends with another artisan, then open their profile to start a chat.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {threads.map((t) => (
              <a
                key={t.id}
                href={`/client/messages/${t.id}`}
                className="flex items-center gap-3 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
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
                    <p className="font-semibold text-gray-800 dark:text-gray-200 truncate">
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
