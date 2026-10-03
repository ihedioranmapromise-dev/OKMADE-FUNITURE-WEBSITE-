"use client";
import { useEffect, useState } from "react";
import { subscribe, flushQueue } from "@/lib/offline-queue";

export default function OfflineQueueIndicator() {
  const [count, setCount] = useState(0);
  const [flushing, setFlushing] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const unsub = subscribe(setCount);
    return unsub;
  }, []);

  useEffect(() => {
    const handleOnline = async () => {
      if (count > 0) {
        setFlushing(true);
        const res = await flushQueue();
        setFlushing(false);
        if (res.sent > 0) {
          setMessage(`Sent ${res.sent} pending action${res.sent > 1 ? "s" : ""}`);
          setTimeout(() => setMessage(""), 4000);
        }
      }
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [count]);

  const retryNow = async () => {
    if (flushing || count === 0) return;
    setFlushing(true);
    setMessage("");
    const res = await flushQueue();
    setFlushing(false);
    if (res.sent > 0) {
      setMessage(`Sent ${res.sent}`);
      setTimeout(() => setMessage(""), 4000);
    } else if (res.remaining > 0) {
      setMessage("Still offline. Will retry automatically.");
      setTimeout(() => setMessage(""), 4000);
    }
  };

  if (count === 0 && !message) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 md:left-6 md:right-auto md:w-auto z-[95] pointer-events-auto">
      <div className="inline-flex items-center gap-3 bg-gray-900 text-white text-sm px-4 py-2.5 rounded-full shadow-2xl">
        {count > 0 ? (
          <>
            <span className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
              </span>
              {count} pending action{count > 1 ? "s" : ""}
            </span>
            <button
              onClick={retryNow}
              disabled={flushing}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-3 py-1 rounded-full transition disabled:opacity-50"
            >
              {flushing ? "Sending..." : "Retry now"}
            </button>
          </>
        ) : (
          <span>{message}</span>
        )}
      </div>
      {message && count > 0 && (
        <div className="mt-2 text-xs text-gray-200 bg-gray-900/90 inline-block px-3 py-1 rounded-full">
          {message}
        </div>
      )}
    </div>
  );
}
