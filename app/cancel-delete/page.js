"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function CancelDeleteContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Missing token.");
      return;
    }
    fetch("/api/client/cancel-delete-by-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (r) => {
        const d = await r.json();
        if (r.ok && d.success) {
          setStatus("success");
        } else {
          setStatus("error");
          setMessage(d.error || "Invalid or expired link.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Network error.");
      });
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-50 to-white dark:from-gray-950 dark:to-gray-900 py-12 px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 text-center">
        <img src="/favicon.ico" alt="OKMADE" className="w-14 h-14 mx-auto mb-4 object-contain" />

        {status === "loading" && (
          <>
            <div className="animate-pulse text-amber-600 dark:text-amber-400">
              Cancelling deletion...
            </div>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
              Account Saved
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Your account deletion has been cancelled. You can log in anytime.
            </p>
            <a
              href="/client/login"
              className="inline-block bg-amber-600 hover:bg-amber-700 text-white font-semibold px-6 py-3 rounded-full transition"
            >
              Log In
            </a>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-16 h-16 mx-auto rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
              Link Invalid
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {message || "This cancel link is invalid or already used."}
            </p>
            <a
              href="/client/login"
              className="inline-block bg-amber-600 hover:bg-amber-700 text-white font-semibold px-6 py-3 rounded-full transition"
            >
              Go to Login
            </a>
          </>
        )}
      </div>
    </div>
  );
}

export default function CancelDeletePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <CancelDeleteContent />
    </Suspense>
  );
}
