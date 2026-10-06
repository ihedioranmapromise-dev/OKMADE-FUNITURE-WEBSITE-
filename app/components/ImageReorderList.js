"use client";
import { useState } from "react";

const UpArrow = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
  </svg>
);

const DownArrow = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const DragHandle = () => (
  <svg
    className="w-4 h-4 text-gray-400"
    fill="currentColor"
    viewBox="0 0 24 24"
  >
    <circle cx="9" cy="6" r="1.5" />
    <circle cx="15" cy="6" r="1.5" />
    <circle cx="9" cy="12" r="1.5" />
    <circle cx="15" cy="12" r="1.5" />
    <circle cx="9" cy="18" r="1.5" />
    <circle cx="15" cy="18" r="1.5" />
  </svg>
);

export default function ImageReorderList({
  images,
  onMoveUp,
  onMoveDown,
  onReorder,
  onDelete,
  emptyMessage = "No images yet.",
}) {
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  if (!images || images.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">{emptyMessage}</p>
    );
  }

  const handleDragStart = (e, idx) => {
    setDraggedIndex(idx);
    e.dataTransfer.effectAllowed = "move";
    try {
      e.dataTransfer.setData("text/plain", String(idx));
    } catch {}
  };

  const handleDragOver = (e, idx) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (idx !== dragOverIndex) setDragOverIndex(idx);
  };

  const handleDrop = (e, idx) => {
    e.preventDefault();
    if (
      draggedIndex !== null &&
      draggedIndex !== idx &&
      typeof onReorder === "function"
    ) {
      onReorder(draggedIndex, idx);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="space-y-3">
      {images.map((img, idx) => {
        const isDragging = draggedIndex === idx;
        const isOver = dragOverIndex === idx && draggedIndex !== idx;
        return (
          <div
            key={img.id || idx}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDrop={(e) => handleDrop(e, idx)}
            className={`flex items-center gap-3 p-2 border rounded-lg bg-gray-50 dark:bg-gray-800 transition ${
              isDragging
                ? "opacity-40 border-gray-300 dark:border-gray-600"
                : isOver
                ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20"
                : "border-gray-200 dark:border-gray-700"
            }`}
          >
            <button
              type="button"
              draggable={true}
              onDragStart={(e) => handleDragStart(e, idx)}
              onDragEnd={handleDragEnd}
              className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 flex-shrink-0 hidden md:block"
              aria-label="Drag to reorder"
              title="Drag to reorder"
            >
              <DragHandle />
            </button>

            <div className="w-9 h-9 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold flex-shrink-0 text-sm">
              {idx + 1}
            </div>

            <div className="relative w-16 h-16 flex-shrink-0 rounded overflow-hidden bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
              <img
                src={img.image_url}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                {img.description || "—"}
              </p>
            </div>

            <div className="flex flex-col gap-1 flex-shrink-0">
              <button
                type="button"
                onClick={() => onMoveUp(idx)}
                disabled={idx === 0}
                className="p-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Move up"
              >
                <UpArrow />
              </button>
              <button
                type="button"
                onClick={() => onMoveDown(idx)}
                disabled={idx === images.length - 1}
                className="p-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Move down"
              >
                <DownArrow />
              </button>
            </div>

            <button
              type="button"
              onClick={() => onDelete(img.id)}
              className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-full flex-shrink-0"
              aria-label="Delete image"
            >
              <CloseIcon />
            </button>
          </div>
        );
      })}
    </div>
  );
}
