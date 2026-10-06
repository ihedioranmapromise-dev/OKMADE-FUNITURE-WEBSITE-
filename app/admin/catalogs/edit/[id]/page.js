"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { adminFetch } from "@/lib/admin-client";
import { CloseIcon } from "@/lib/icons";
import ImageReorderList from "@/app/components/ImageReorderList";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function EditCatalog() {
  const { id } = useParams();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [orderDirty, setOrderDirty] = useState(false);
  const [orderSaving, setOrderSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("adminAuth") !== "true") {
      router.replace("/admin/login");
      return;
    }
    load();
  }, [id]);

  async function load() {
    setLoading(true);
    const res = await adminFetch(`/api/admin/catalogs/single?id=${id}`);
    if (!res.ok) {
      setMessage("Catalog not found.");
      setLoading(false);
      return;
    }
    const data = await res.json();
    setTitle(data.title || "");
    setExistingImages(data.images || []);
    setOrderDirty(false);
    setLoading(false);
  }

  const handleNewImages = (e) => {
    const files = Array.from(e.target.files);
    if (existingImages.length + newImages.length + files.length > 6) {
      setMessage("Max 6 images total.");
      return;
    }
    setNewImages([...newImages, ...files.map((file) => ({ file, description: "" }))]);
  };

  const removeNewImage = (idx) => {
    const updated = [...newImages];
    updated.splice(idx, 1);
    setNewImages(updated);
  };

  const updateNewDesc = (idx, value) => {
    const updated = [...newImages];
    updated[idx].description = value;
    setNewImages(updated);
  };

  const moveUp = (idx) => {
    if (idx === 0) return;
    const next = [...existingImages];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    setExistingImages(next);
    setOrderDirty(true);
  };

  const moveDown = (idx) => {
    if (idx === existingImages.length - 1) return;
    const next = [...existingImages];
    [next[idx + 1], next[idx]] = [next[idx], next[idx + 1]];
    setExistingImages(next);
    setOrderDirty(true);
  };

  const reorder = (from, to) => {
    const next = [...existingImages];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setExistingImages(next);
    setOrderDirty(true);
  };

  const deleteExistingImage = async (imageId) => {
    if (!confirm("Delete this image?")) return;
    const res = await adminFetch(`/api/admin/catalog-images?id=${imageId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setExistingImages(existingImages.filter((i) => i.id !== imageId));
      setOrderDirty(true);
    } else {
      alert("Delete failed.");
    }
  };

  const saveOrder = async () => {
    setOrderSaving(true);
    const order = existingImages.map((img, idx) => ({
      id: img.id,
      display_order: idx,
    }));
    const res = await adminFetch("/api/admin/catalog-images", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order }),
    });
    setOrderSaving(false);
    if (res.ok) {
      setOrderDirty(false);
      setMessage("Order saved.");
    } else {
      setMessage("Failed to save order.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const upRes = await adminFetch("/api/admin/catalogs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, title }),
      });
      if (!upRes.ok) throw new Error("Update failed");

      if (newImages.length > 0) {
        const uploaded = [];
        for (let i = 0; i < newImages.length; i++) {
          const { file, description: d } = newImages[i];
          const ext = file.name.split(".").pop();
          const path = `${id}_${Date.now()}_${i}.${ext}`;
          const { error: upErr } = await sb.storage
            .from("catalog-bucket")
            .upload(path, file, { cacheControl: "31536000", upsert: true });
          if (upErr) throw upErr;
          const { data: urlData } = sb.storage
            .from("catalog-bucket")
            .getPublicUrl(path);
          uploaded.push({
            url: urlData.publicUrl,
            description: d || null,
            display_order: existingImages.length + i,
          });
        }
        await adminFetch("/api/admin/catalog-images", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ catalog_id: id, images: uploaded }),
        });
      }

      if (orderDirty) {
        await saveOrder();
      }

      setMessage("Catalog updated.");
      setNewImages([]);
      const el = document.getElementById("newImages");
      if (el) el.value = "";
      await load();
    } catch (err) {
      setMessage("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          <div className="h-64 bg-gray-100 dark:bg-gray-900 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            Edit Catalog
          </h1>
          <a
            href="/admin/dashboard?tab=catalogs"
            className="text-sm text-amber-600 dark:text-amber-400 hover:underline"
          >
            ← Back
          </a>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="bg-white dark:bg-gray-900 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <label className="block font-medium mb-1 text-sm text-gray-700 dark:text-gray-300">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
            />
          </div>

          <div className="bg-white dark:bg-gray-900 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
              <h2 className="font-semibold text-gray-800 dark:text-gray-100">
                Existing Images ({existingImages.length})
              </h2>
              {orderDirty && (
                <button
                  type="button"
                  onClick={saveOrder}
                  disabled={orderSaving}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50"
                >
                  {orderSaving ? "Saving..." : "Save Order"}
                </button>
              )}
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 hidden md:block">
              Drag the ⋮⋮ handle or use the arrows to reorder.
            </p>

            <ImageReorderList
              images={existingImages}
              onMoveUp={moveUp}
              onMoveDown={moveDown}
              onReorder={reorder}
              onDelete={deleteExistingImage}
              emptyMessage="No images."
            />
          </div>

          <div className="bg-white dark:bg-gray-900 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">
              Add New Images
            </h2>
            <input
              id="newImages"
              type="file"
              accept="image/*"
              multiple
              onChange={handleNewImages}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
            />
            {newImages.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                {newImages.map((item, idx) => (
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
                      onChange={(e) => updateNewDesc(idx, e.target.value)}
                      className="w-full mt-1 p-1 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100"
                    />
                    <button
                      type="button"
                      onClick={() => removeNewImage(idx)}
                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center"
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
            disabled={saving}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 rounded-lg disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>

          {message && (
            <p
              className={`text-sm text-center ${
                message.startsWith("Error") ? "text-red-500" : "text-green-600 dark:text-green-400"
              }`}
            >
              {message}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
