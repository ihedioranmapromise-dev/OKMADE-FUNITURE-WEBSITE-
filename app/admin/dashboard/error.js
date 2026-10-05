"use client";
import { useEffect } from "react";

export default function AdminError({ error, reset }) {
  useEffect(() => {
    console.error("Admin error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950 px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
          Admin panel error
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Something broke in the admin dashboard. Your session is still active.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="bg-amber-600 hover:bg-amber-700 text-white font-semibold px-5 py-2.5 rounded-lg transition"
          >
            Try Again
          </button>
          <a
            href="/admin/dashboard"
            className="bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold px-5 py-2.5 rounded-lg transition"
          >
            Reload Dashboard
          </a>
        </div>
        {process.env.NODE_ENV !== "production" && error?.message && (
          <pre className="mt-6 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs text-red-600 dark:text-red-400 text-left overflow-auto">
            {error.message}
          </pre>
        )}
      </div>
    </div>
  );
}
