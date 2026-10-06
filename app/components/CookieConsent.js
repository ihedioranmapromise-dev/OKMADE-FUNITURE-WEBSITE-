"use client";
import { useEffect, useState } from "react";

const STORAGE_KEY = "okmade_cookie_consent";

function isEUTimezone() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    return (
      tz.startsWith("Europe/") ||
      tz === "Atlantic/Reykjavik" ||
      tz === "Atlantic/Canary" ||
      tz === "Atlantic/Madeira" ||
      tz === "Atlantic/Azores"
    );
  } catch {
    return false;
  }
}

export default function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isEUTimezone()) return;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return;
    const timer = setTimeout(() => setShow(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  const accept = () => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ accepted: true, at: Date.now() })
      );
    } catch {}
    setShow(false);
  };

  const decline = () => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ accepted: false, at: Date.now() })
      );
    } catch {}
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-6 md:right-auto md:max-w-md z-[95] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4">
      <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
        We use cookies to keep you logged in and understand how the site is used.
        You can accept or decline non-essential cookies.
      </p>
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={accept}
          className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition"
        >
          Accept
        </button>
        <button
          onClick={decline}
          className="bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-semibold px-4 py-2 rounded-lg transition"
        >
          Decline
        </button>
        <a
          href="/privacy"
          className="text-xs text-amber-600 dark:text-amber-400 hover:underline self-center ml-auto"
        >
          Learn more
        </a>
      </div>
    </div>
  );
}
