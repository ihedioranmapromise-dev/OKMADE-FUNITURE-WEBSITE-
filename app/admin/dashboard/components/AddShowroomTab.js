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

export default function AddShowroomTab() {
  const [imageData, setImageData] = useState([]);
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [sold, setSold] = useState(false);
  const [featured, setFeatured] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const [autoPostOpen, setAutoPostOpen] = useState(false);
  const [autoPostData, setAutoPostData] = useState({
    type: "product",
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
    if (imageData.length === 0) {
      setMessage("Select at least one image.");
      return;
    }
    if (!description || !price) {
      setMessage("Description and price required.");
      return;
    }
    setUploading(true);
    setMessage("");
    try {
      // Upload images first
      const uploaded = [];
      const tempId = Date.now();
      for (let i = 0; i < imageData.length; i++) {
        const { file, description: d } = imageData[i];
        const ext = file.name.split(".").pop();
        const path = `products/${tempId}_${i}.${ext}`;
        const { error: upErr } = await sb.storage
          .from("showroom-bucket")
          .upload(path, file, { cacheControl: "31536000" });
        if (upErr) throw upErr;
        const { data: urlData } = sb.storage
          .from("showroom-bucket")
          .getPublicUrl(path);
        uploaded.push({ url: urlData.publicUrl, description: d || null });
      }

      const res = await adminFetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          price,
          sold,
          featured,
          images: uploaded,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");

      setMessage(`Product added.`);
      setAutoPostData({
        type: "product",
        sourceId: data.id,
        defaultContent: `🛋️ New in showroom: ${description} — ₦${parseFloat(price).toLocaleString()}`,
        previewImages: uploaded.map((i) => i.url),
      });
      setAutoPostOpen(true);

      setImageData([]);
      setDescription("");
      setPrice("");
      setSold(false);
      setFeatured(false);
      const el = document.getElementById("productImages");
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
        Add Product to Showroom
      </h1>
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 space-y-4"
      >
        <div>
          <label className="block font-medium mb-1 text-sm text-gray-700 dark:text-gray-300">
            Product Images (up to 6)
          </label>
          <input
            id="productImages"
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

        <div>
          <label className="block font-medium mb-1 text-sm text-gray-700 dark:text-gray-300">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows="3"
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
          />
        </div>

        <div>
          <label className="block font-medium mb-1 text-sm text-gray-700 dark:text-gray-300">
            Price (₦)
          </label>
          <input
            type="number"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
          />
        </div>

        <div className="flex gap-4 flex-wrap">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={sold}
              onChange={(e) => setSold(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Mark as Sold</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Featured on homepage</span>
          </label>
        </div>

        <button
          type="submit"
          disabled={uploading}
          className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-lg font-medium disabled:opacity-50"
        >
          {uploading ? "Uploading..." : "Add Product"}
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
