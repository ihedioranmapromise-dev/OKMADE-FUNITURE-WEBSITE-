"use client";
import { useEffect, useState, useMemo, useRef } from "react";
import { TAB_GROUPS } from "./Sidebar";

export default function CommandPalette({ open, onClose, onSelectTab }) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);

  const allItems = useMemo(() => {
    const items = [];
    TAB_GROUPS.forEach((g) =>
      g.items.forEach((i) =>
        items.push({ id: i.id, label: i.label, group: g.label })
      )
    );
    return items;
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return allItems;
    const q = query.toLowerCase();
    return allItems.filter(
      (i) =>
        i.label.toLowerCase().includes(q) || i.group.toLowerCase().includes(q)
    );
  }, [query, allItems]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(0, i - 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const item = filtered[activeIndex];
        if (item) {
          onSelectTab(item.id);
          onClose();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, filtered, activeIndex, onClose, onSelectTab]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] bg-black/60 flex items-start justify-center p-4 pt-24"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-200 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <svg
            className="w-5 h-5 text-gray-400 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            placeholder="Search admin..."
            className="flex-1 px-3 bg-transparent outline-none text-gray-800 dark:text-gray-100"
          />
          <kbd className="hidden md:inline-block text-xs text-gray-400 border border-gray-300 dark:border-gray-600 rounded px-2 py-0.5">
            ESC
          </kbd>
        </div>

        <div className="max-h-96 overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
              No results for "{query}"
            </p>
          ) : (
            filtered.map((item, idx) => (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onClose();
                }}
                onMouseEnter={() => setActiveIndex(idx)}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-sm ${
                  idx === activeIndex
                    ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300"
                    : "text-gray-700 dark:text-gray-300"
                }`}
              >
                <span>{item.label}</span>
                <span className="text-xs text-gray-400">{item.group}</span>
              </button>
            ))
          )}
        </div>

        <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-400 flex justify-between">
          <span>↑↓ to navigate</span>
          <span>↵ to open</span>
        </div>
      </div>
    </div>
  );
}
