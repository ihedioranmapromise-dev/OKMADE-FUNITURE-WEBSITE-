"use client";
import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { CloseIcon } from "@/lib/icons";
import { adminFetch } from "@/lib/admin-client";
import AutoPostModal from "@/app/components/AutoPostModal";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function AddCatalogTab() {
  const [title, setTitle] = useState("");
  const [imageData, setImageData] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const [autoPostOpen, setAutoPostOpen] = useState(false);
  const [autoPostData, setAutoPostData] = useState({
    type: "catalog",
    sourceId: "",
    defaultContent: "",
    previewImages: [],
  });

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (imageData.length + files.length > 6) {
      setMessage("Max 6 images.");
      return;
    }
    setImageData([
      ...imageData,
      ...files.map((file) => ({ file, description: "" })),
    ]);
  };

  const handleDescChange = (index, value) => {
    const updated = [...imageData];
    updated[index].description = value;
    setImageData(updated);
  };

  const removeImage = (index) => {
    const updated = [...imageData];
    updated.splice(index, 1);
    setImageData(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setMessage("Title required.");
      return;
    }
    if (imageData.length === 0) {
      setMessage("Select at least one image.");
      return;
    }
    setUploading(true);
    setMessage("");
    try {
      const uploaded = [];
      const tempId = Date.now();
      for (let i = 0; i < imageData.length; i++) {
        const { file, description: d } = imageData[i];
        const ext = file.name.split(".").pop();
        const path = `${tempId}_${i}.${ext}`;
        const { error: upErr } = await sb.storage
          .from("catalog-bucket")
          .upload(path, file, { cacheControl: "31536000" });
        if (upErr) throw upErr;
        const { data: urlData } = sb.storage
          .from("catalog-bucket")
          .getPublicUrl(path);
        uploaded.push({ url: urlData.publicUrl, description: d || null });
      }

      const res = await adminFetch("/api/admin/catalogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), images: uploaded }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");

      setMessage(`Catalog added.`);
      setAutoPostData({
        type: "catalog",
        sourceId: data.id,
        defaultContent: `📖 New catalog: ${title.trim()}`,
        previewImages: uploaded.map((i) => i.url),
      });
      setAutoPostOpen(true);

      setTitle("");
      setImageData([]);
      const el = document.getElementById("catalogImages");
      if (el) el.value = "";
    } catch (err) {
      setMessage("Error: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">
        Add Catalog Space
      </h1>
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 space-y-4"
      >
        <div>
          <label className="block font-medium mb-1 text-sm text-gray-700 dark:text-gray-300">
            Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
          />
        </div>

        <div>
          <label className="block font-medium mb-1 text-sm text-gray-700 dark:text-gray-300">
            Images (up to 6)
          </label>
          <input
            id="catalogImages"
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
          />
          {imageData.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
              {imageData.map((item, idx) => (
                <div
                  key={idx}
                  className="relative border border-gray-200 dark:border-gray-700 rounded-lg p-2 bg-gray-50 dark:bg-gray-800"
                >
                  <img
                    src={URL.createObjectURL(item.file)}
                    className="w-full h-24 object-cover rounded"
                    alt=""
                  />
                  <input
                    type="text"
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => handleDescChange(idx, e.target.value)}
                    className="w-full mt-1 p-1 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center"
                  >
                    <CloseIcon className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={uploading}
          className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-lg font-medium disabled:opacity-50"
        >
          {uploading ? "Uploading..." : "Add Catalog Space"}
        </button>

        {message && (
          <p
            className={`text-sm ${
              message.startsWith("Error") ? "text-red-500" : "text-green-600 dark:text-green-400"
            }`}
          >
            {message}
          </p>
        )}
      </form>

      <AutoPostModal
        open={autoPostOpen}
        onClose={() => setAutoPostOpen(false)}
        type={autoPostData.type}
        sourceId={autoPostData.sourceId}
        defaultContent={autoPostData.defaultContent}
        previewImages={autoPostData.previewImages}
      />
    </div>
  );
}
