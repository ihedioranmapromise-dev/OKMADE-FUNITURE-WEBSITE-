"use client";
import { useState, useRef } from "react";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import { fetchWithRetry } from "@/lib/fetch-with-retry";
import { enqueue } from "@/lib/offline-queue";

const FONT_OPTIONS = [
  { label: "Default", value: "sans-serif" },
  { label: "Serif", value: "serif" },
  { label: "Handwriting", value: "'Dancing Script', cursive" },
  { label: "Elegant", value: "'Playfair Display', serif" },
  { label: "Bold", value: "'Lobster', cursive" },
  { label: "Modern", value: "'Montserrat', sans-serif" },
];

async function uploadWithRetry(supabase, path, file, retries = 3) {
  let lastErr;
  for (let i = 0; i <= retries; i++) {
    const { error } = await supabase.storage
      .from("story-images")
      .upload(path, file, { cacheControl: "31536000", upsert: true });
    if (!error) return { ok: true };
    lastErr = error;
    await new Promise((r) => setTimeout(r, 500 * Math.pow(2, i)));
  }
  return { ok: false, error: lastErr };
}

export default function PostComposer({ onPosted }) {
  const [content, setContent] = useState("");
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [font, setFont] = useState("sans-serif");
  const [posting, setPosting] = useState(false);
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const fileInputRef = useRef(null);
  const supabase = createSupabaseBrowser();

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    if (files.length + newFiles.length > 4) {
      setMessage("Max 4 images per post");
      return;
    }
    const allFiles = [...files, ...newFiles];
    const allPreviews = allFiles.map((f) => URL.createObjectURL(f));
    previews.forEach((p) => URL.revokeObjectURL(p));
    setFiles(allFiles);
    setPreviews(allPreviews);
  };

  const removeImage = (idx) => {
    const newFiles = [...files];
    newFiles.splice(idx, 1);
    previews.forEach((p) => URL.revokeObjectURL(p));
    const newPreviews = newFiles.map((f) => URL.createObjectURL(f));
    setFiles(newFiles);
    setPreviews(newPreviews);
  };

  const clearComposer = () => {
    previews.forEach((p) => URL.revokeObjectURL(p));
    setContent("");
    setFiles([]);
    setPreviews([]);
    setFont("sans-serif");
    setProgress({ done: 0, total: 0 });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handlePost = async () => {
    if (!content.trim() && files.length === 0) {
      setMessage("Write something or add an image");
      return;
    }

    if (!navigator.onLine && files.length > 0) {
      setMessage("You can't post images while offline. Remove them or wait.");
      return;
    }

    setPosting(true);
    setMessage("");

    try {
      if (!navigator.onLine) {
        enqueue({
          url: "/api/posts",
          method: "POST",
          body: { content, image_urls: [], font_family: font },
          label: "Post",
        });
        clearComposer();
        setMessage("Saved. Will post when you're back online.");
        setTimeout(() => setMessage(""), 4000);
        onPosted?.();
        setPosting(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      setProgress({ done: 0, total: files.length });

      const uploadResults = await Promise.all(
        files.map(async (file, i) => {
          const ext = file.name.split(".").pop();
          const path = `posts/${user.id}_${Date.now()}_${i}_${Math.random()
            .toString(36)
            .slice(2)}.${ext}`;
          const result = await uploadWithRetry(supabase, path, file);
          if (!result.ok) throw new Error(`Upload failed: ${file.name}`);
          const { data: urlData } = supabase.storage
            .from("story-images")
            .getPublicUrl(path);
          setProgress((p) => ({ ...p, done: p.done + 1 }));
          return urlData.publicUrl;
        })
      );

      const res = await fetchWithRetry("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          image_urls: uploadResults,
          font_family: font,
        }),
      });
      if (!res.ok) throw new Error("Failed to post");

      clearComposer();
      onPosted?.();
    } catch (err) {
      setMessage("Error: " + err.message);
      setProgress({ done: 0, total: 0 });
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What's on your mind?"
        rows="3"
        className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-amber-500 resize-none bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
        style={{ fontFamily: font }}
      />

      {previews.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mt-3">
          {previews.map((p, i) => (
            <div key={i} className="relative">
              <img src={p} className="w-full h-32 object-cover rounded-lg" alt="" />
              <button
                onClick={() => removeImage(i)}
                className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full w-6 h-6 text-xs flex items-center justify-center"
                aria-label="Remove"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {posting && progress.total > 0 && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
            <span>Uploading images...</span>
            <span>
              {progress.done} / {progress.total}
            </span>
          </div>
          <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-600 transition-all duration-300"
              style={{
                width: `${(progress.done / progress.total) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 mt-3 flex-wrap">
        <label className="cursor-pointer bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 text-gray-700 dark:text-gray-300">
          📷 Photo
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
        </label>

        <select
          value={font}
          onChange={(e) => setFont(e.target.value)}
          className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300"
          style={{ fontFamily: font }}
        >
          {FONT_OPTIONS.map((f) => (
            <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>
              {f.label}
            </option>
          ))}
        </select>

        <button
          onClick={handlePost}
          disabled={posting || (!content.trim() && files.length === 0)}
          className="ml-auto bg-amber-600 hover:bg-amber-700 text-white px-5 py-2 rounded-lg font-semibold disabled:opacity-50"
        >
          {posting ? "Posting..." : "Post"}
        </button>
      </div>

      {message && (
        <p
          className={`mt-2 text-sm ${
            message.startsWith("Error")
              ? "text-red-500"
              : "text-amber-700 dark:text-amber-300"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
