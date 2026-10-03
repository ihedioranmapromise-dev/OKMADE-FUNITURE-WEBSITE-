"use client";
import { useEffect, useState } from "react";

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [isSlow, setIsSlow] = useState(false);
  const [showBackOnline, setShowBackOnline] = useState(false);

  useEffect(() => {
    setIsOffline(!navigator.onLine);

    const handleOffline = () => {
      setIsOffline(true);
      setShowBackOnline(false);
      setIsSlow(false);
    };

    const handleOnline = () => {
      setIsOffline(false);
      setShowBackOnline(true);
      setTimeout(() => setShowBackOnline(false), 3000);
    };

    const handleSlow = () => {
      if (!navigator.onLine) return;
      setIsSlow(true);
      setTimeout(() => setIsSlow(false), 8000);
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    window.addEventListener("okmade-slow", handleSlow);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("okmade-slow", handleSlow);
    };
  }, []);

  if (!isOffline && !isSlow && !showBackOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9998] pointer-events-none">
      {isOffline && (
        <div className="bg-red-600 text-white text-center py-2 px-4 shadow-lg">
          <div className="flex items-center justify-center gap-2 text-sm font-medium">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
            </svg>
            <span>You're offline. Check your internet connection.</span>
          </div>
        </div>
      )}

      {!isOffline && isSlow && (
        <div className="bg-amber-500 text-white text-center py-2 px-4 shadow-lg">
          <div className="flex items-center justify-center gap-2 text-sm font-medium">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>Slow connection. Things might take a moment.</span>
          </div>
        </div>
      )}

      {!isOffline && !isSlow && showBackOnline && (
        <div className="bg-green-600 text-white text-center py-2 px-4 shadow-lg">
          <div className="flex items-center justify-center gap-2 text-sm font-medium">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span>Back online</span>
          </div>
        </div>
      )}
    </div>
  );
}
