"use client";
import { useEffect, useState } from "react";

export default function AutoPostModal({
  open,
  onClose,
  type,
  sourceId,
  defaultContent,
  previewImages = [],
  onPosted,
}) {
  const [content, setContent] = useState(defaultContent || "");
  const [sendEmail, setSendEmail] = useState(true);
  const [posting, setPosting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (open) {
      setContent(defaultContent || "");
      setSendEmail(true);
      setMessage("");
      setPosting(false);
    }
  }, [open, defaultContent]);

  if (!open) return null;

  const handlePost = async () => {
    if (!content.trim()) {
      setMessage("Caption can't be empty.");
      return;
    }
    setPosting(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/auto-post", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key":
            process.env.NEXT_PUBLIC_ADMIN_API_KEY || "okmade_super_secret_2026",
        },
        body: JSON.stringify({
          type,
          source_id: sourceId,
          content: content.trim(),
          send_email: sendEmail,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Post failed");
      }
      if (data.success === false) {
        setMessage("This item was already posted.");
        setTimeout(() => {
          onPosted && onPosted(data);
          onClose && onClose();
        }, 1200);
        return;
      }
      setMessage(
        `Posted! ${
          sendEmail ? `Email sent to ${data.emails?.sent || 0} follower(s).` : ""
        }`
      );
      setTimeout(() => {
        onPosted && onPosted(data);
        onClose && onClose();
      }, 900);
    } catch (err) {
      setMessage("Error: " + err.message);
    } finally {
      setPosting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[110] bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-800">
            Post this to the Public Feed?
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            It will appear as <strong>OKMADE Official</strong> and everyone can see it in the feed.
          </p>
        </div>

        <div className="px-5 py-4 space-y-4">
          {previewImages.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {previewImages.slice(0, 6).map((img, idx) => (
                <div key={idx} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Caption (editable)
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows="4"
              className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-amber-500"
              placeholder="Write your caption..."
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={sendEmail}
              onChange={(e) => setSendEmail(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm text-gray-700">
              Also email all OKMADE followers
            </span>
          </label>

          {message && (
            <p
              className={`text-sm ${
                message.startsWith("Error") ? "text-red-500" : "text-green-600"
              }`}
            >
              {message}
            </p>
          )}
        </div>

        <div className="px-5 py-4 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            disabled={posting}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2.5 rounded-lg transition disabled:opacity-50"
          >
            Skip
          </button>
          <button
            onClick={handlePost}
            disabled={posting}
            className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-medium py-2.5 rounded-lg transition disabled:opacity-50"
          >
            {posting ? "Posting..." : "Yes, Post to Feed"}
          </button>
        </div>
      </div>
    </div>
  );
}
