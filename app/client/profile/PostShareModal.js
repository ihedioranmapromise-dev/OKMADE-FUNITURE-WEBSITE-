"use client";
import { useState, useEffect } from "react";

export default function PostShareModal({
  open,
  imageUrl,
  kind,
  onConfirm,
  onCancel,
  saving,
}) {
  const [shareChecked, setShareChecked] = useState(false);
  const [text, setText] = useState("");

  useEffect(() => {
    if (open) {
      setShareChecked(false);
      setText(
        kind === "cover_photo"
          ? "I just updated my cover photo."
          : "I just updated my profile picture."
      );
    }
  }, [open, kind]);

  if (!open) return null;

  const isCover = kind === "cover_photo";

  const handleConfirmClick = () => {
    console.log("[PostShareModal] Confirm clicked. shareChecked =", shareChecked, "text =", text);
    onConfirm(shareChecked, text.trim());
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4"
      onClick={() => !saving && onCancel()}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-3">
          {isCover ? "Cover photo updated" : "Profile picture updated"}
        </h3>

        <div
          className={`relative w-full overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800 mb-4 ${
            isCover ? "h-32" : "h-40 flex items-center justify-center"
          }`}
        >
          {imageUrl && (
            isCover ? (
              <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <img
                src={imageUrl}
                alt="Preview"
                className="w-32 h-32 rounded-full object-cover border-4 border-white dark:border-gray-900"
              />
            )
          )}
        </div>

        <label className="flex items-center gap-2 cursor-pointer mb-3">
          <input
            type="checkbox"
            checked={shareChecked}
            onChange={(e) => {
              console.log("[PostShareModal] Checkbox changed to", e.target.checked);
              setShareChecked(e.target.checked);
            }}
            className="w-4 h-4"
          />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
            Share this as a post on my feed
          </span>
        </label>

        {shareChecked && (
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Post text
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows="3"
              className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
              placeholder="Say something about this..."
            />
          </div>
        )}

        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          If you cancel, nothing will change. Your picture will not be saved.
        </p>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="flex-1 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium py-2.5 rounded-lg disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmClick}
            disabled={saving}
            className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-medium py-2.5 rounded-lg disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
