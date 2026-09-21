"use client";
import { useState, useRef } from "react";
import { createSupabaseBrowser } from "@/lib/supabase-browser";

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
    setFiles(allFiles);
    setPreviews(allFiles.map((f) => URL.createObjectURL(f)));
  };

  const removeImage = (idx) => {
    const newFiles = [...files];
    newFiles.splice(idx, 1);
    setFiles(newFiles);
    setPreviews(newFiles.map((f) => URL.createObjectURL(f)));
  };

  const handlePost = async () => {
    if (!content.trim() && files.length === 0) {
      setMessage("Write something or add an image");
      return;
    }
    setPosting(true);
    setMessage("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      // Upload images to story-images bucket (reuse)
      const imageUrls = [];
      for (const file of files) {
        const ext = file.name.split(".").pop();
        const path = `posts/${user.id}_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("story-images").upload(path, file);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("story-images").getPublicUrl(path);
        imageUrls.push(urlData.publicUrl);
      }

      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, image_urls: imageUrls, font_family: font }),
      });
      if (!res.ok) throw new Error("Failed to post");

      setContent("");
      setFiles([]);
      setPreviews([]);
      setFont("sans-serif");
      if (fileInputRef.current) fileInputRef.current.value = "";
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
                className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 text-xs"
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

      {message && <p className="mt-2 text-sm text-red-500">{message}</p>}
    </div>
  );
}
