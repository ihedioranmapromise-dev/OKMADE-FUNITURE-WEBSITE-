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

export default function PostComposer({ onPosted }) {
  const [content, setContent] = useState("");
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [font, setFont] = useState("sans-serif");
  const [posting, setPosting] = useState(false);
  const [message, setMessage] = useState("");
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
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handlePost = async () => {
    if (!content.trim() && files.length === 0) {
      setMessage("Write something or add an image");
      return;
    }

    // If offline and has images — can't queue images, so block
    if (!navigator.onLine && files.length > 0) {
      setMessage("You can't post images while offline. Remove them or wait until you're back online.");
      return;
    }

    setPosting(true);
    setMessage("");

    try {
      // If offline and no images — queue the post
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

      // Online — upload images in parallel
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      const uploadResults = await Promise.all(
        files.map(async (file, i) => {
          const ext = file.name.split(".").pop();
          const path = `posts/${user.id}_${Date.now()}_${i}_${Math.random()
            .toString(36)
            .slice(2)}.${ext}`;
          const { error: uploadError } = await supabase.storage
            .from("story-images")
            .upload(path, file, { cacheControl: "31536000" });
          if (uploadError) throw uploadError;
          const { data: urlData } = supabase.storage
            .from("story-images")
            .getPublicUrl(path);
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
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What's on your mind?"
        rows="3"
        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-amber-500 resize-none"
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
                aria-label="Remove image"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 mt-3 flex-wrap">
        <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
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
          className="bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg text-sm"
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
        <p className={`mt-2 text-sm ${message.startsWith("Error") ? "text-red-500" : "text-amber-700"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
