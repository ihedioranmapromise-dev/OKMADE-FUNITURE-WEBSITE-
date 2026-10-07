"use client";
import { useEffect, useState } from "react";

export default function PWAUpdateBanner() {
  const [show, setShow] = useState(false);
  const [registration, setRegistration] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    let refreshInterval;

    navigator.serviceWorker.ready.then((reg) => {
      setRegistration(reg);
      reg.update();

      refreshInterval = setInterval(() => reg.update(), 60 * 60 * 1000);

      reg.addEventListener("updatefound", () => {
        const newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            setShow(true);
          }
        });
      });
    });

    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, []);

  const reload = async () => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: "SKIP_WAITING" });
    }
    setTimeout(() => window.location.reload(), 400);
  };

  if (!show) return null;

  return (
    <div className="fixed top-20 left-4 right-4 md:left-auto md:right-6 md:w-96 z-[97] bg-gray-900 dark:bg-gray-800 text-white rounded-xl shadow-2xl p-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">New version available</p>
          <p className="text-xs text-gray-300 mt-1">
            Update to get the latest improvements.
          </p>
          <button
            onClick={reload}
            className="mt-3 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition"
          >
            Refresh now
          </button>
        </div>
        <button
          onClick={() => setShow(false)}
          className="text-gray-400 hover:text-white text-lg leading-none"
          aria-label="Close"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
