"use client";
import { useEffect, useRef, useState } from "react";

export default function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  storageKey = "okmade_recent_searches",
  debounceMs = 300,
  className = "",
  minCharsToSave = 3,
}) {
  const [localValue, setLocalValue] = useState(value || "");
  const [recent, setRecent] = useState([]);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem(storageKey);
      setRecent(stored ? JSON.parse(stored) : []);
    } catch {
      setRecent([]);
    }
  }, [storageKey]);

  useEffect(() => {
    if (value !== undefined && value !== localValue) {
      setLocalValue(value);
    }
  }, [value]);

  const persist = (items) => {
    setRecent(items);
    try {
      localStorage.setItem(storageKey, JSON.stringify(items));
    } catch {}
  };

  const commitSearch = (term) => {
    const t = term.trim();
    if (t.length < minCharsToSave) return;
    const next = [t, ...recent.filter((r) => r !== t)].slice(0, 3);
    persist(next);
  };

  const handleChange = (e) => {
    const v = e.target.value;
    setLocalValue(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onChange?.(v);
      if (v.trim().length >= minCharsToSave) commitSearch(v);
    }, debounceMs);
  };

  const submitNow = (term) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setLocalValue(term);
    onChange?.(term);
    setFocused(false);
    inputRef.current?.blur();
  };

  const clearRecent = () => persist([]);

  const removeOne = (term, e) => {
    e.stopPropagation();
    persist(recent.filter((r) => r !== term));
  };

  const showRecent = focused && recent.length > 0 && !localValue.trim();

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={localValue}
          onChange={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
          placeholder={placeholder}
          className="w-full p-4 pl-12 pr-10 border border-amber-200/50 dark:border-gray-700 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-300 bg-white/80 dark:bg-gray-800/80 dark:text-gray-100 backdrop-blur-sm transition"
        />
        <svg
          className="absolute left-4 top-4 h-5 w-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        {localValue && (
          <button
            onClick={() => submitNow("")}
            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            aria-label="Clear"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {showRecent && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 z-30 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 dark:border-gray-700">
            <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">
              Recent searches
            </span>
            <button
              onClick={clearRecent}
              className="text-xs text-amber-600 dark:text-amber-400 hover:underline"
            >
              Clear
            </button>
          </div>
          {recent.map((term) => (
            <div
              key={term}
              className="flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50"
            >
              <button
                onClick={() => submitNow(term)}
                className="flex-1 text-left px-4 py-3 flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300"
              >
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {term}
              </button>
              <button
                onClick={(e) => removeOne(term, e)}
                className="p-2 mr-2 text-gray-400 hover:text-red-500"
                aria-label="Remove"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
