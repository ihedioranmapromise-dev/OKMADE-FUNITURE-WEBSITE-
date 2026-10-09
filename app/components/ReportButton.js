"use client";
import { useState } from "react";

const FlagIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 2H21l-3 6 3 6h-8.5l-1-2H5a2 2 0 00-2 2zm9-13.5V9" />
  </svg>
);

const REASONS = [
  "Spam or misleading",
  "Harassment or bullying",
  "Hate speech",
  "Violence or dangerous content",
  "Nudity or sexual content",
  "Scam or fraud",
  "Other",
];

export default function ReportButton({ postId, commentId, iconOnly = false }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);

  const reset = () => {
    setReason("");
    setDetails("");
    setMessage("");
    setSubmitting(false);
  };

  const handleOpen = (e) => {
    e?.stopPropagation();
    setOpen(true);
    reset();
  };

  const handleClose = (e) => {
    e?.stopPropagation();
    if (submitting) return;
    setOpen(false);
    reset();
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!reason.trim()) {
      setMessage("Please pick a reason.");
      return;
    }
    setSubmitting(true);
    setMessage("");
    try {
      const url = commentId
        ? `/api/comments/${commentId}/report`
        : `/api/posts/${postId}/report`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, details }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setDone(true);
      setMessage("Thank you. We will review this shortly.");
      setTimeout(() => {
        setOpen(false);
        reset();
        setDone(false);
      }, 2000);
    } catch (err) {
      setMessage("Error: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {iconOnly ? (
        <button
          onClick={handleOpen}
          className="px-2 py-2 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          aria-label="Report"
          title="Report"
        >
          <FlagIcon className="w-4 h-4" />
        </button>
      ) : (
        <button
          onClick={handleOpen}
          className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition"
        >
          <FlagIcon className="w-3.5 h-3.5" /> Report
        </button>
      )}

      {open && (
        <div
          className="fixed inset-0 z-[110] bg-black/60 flex items-end md:items-center justify-center p-0 md:p-4"
          onClick={handleClose}
        >
          <div
            className="bg-white dark:bg-gray-900 w-full md:max-w-md md:rounded-2xl rounded-t-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <h3 className="font-bold text-gray-800 dark:text-gray-100">
                Report {commentId ? "comment" : "post"}
              </h3>
              <button
                onClick={handleClose}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition"
                aria-label="Close"
              >
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {done ? (
              <div className="p-8 text-center">
                <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-7 h-7 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">{message}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Tell us what is wrong. Your report is private.
                </p>

                <div className="space-y-2">
                  {REASONS.map((r) => (
                    <label
                      key={r}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                        reason === r
                          ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20"
                          : "border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
                      }`}
                    >
                      <input
                        type="radio"
                        name="reason"
                        value={r}
                        checked={reason === r}
                        onChange={(e) => setReason(e.target.value)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-gray-800 dark:text-gray-200">{r}</span>
                    </label>
                  ))}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    More details (optional)
                  </label>
                  <textarea
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    rows="3"
                    maxLength={500}
                    className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                    placeholder="Anything else we should know?"
                  />
                </div>

                {message && !done && (
                  <p className={`text-sm ${message.startsWith("Error") ? "text-red-500" : "text-amber-600 dark:text-amber-400"}`}>
                    {message}
                  </p>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={submitting}
                    className="flex-1 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium py-2.5 rounded-lg transition disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 rounded-lg transition disabled:opacity-50"
                  >
                    {submitting ? "Sending..." : "Submit Report"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
