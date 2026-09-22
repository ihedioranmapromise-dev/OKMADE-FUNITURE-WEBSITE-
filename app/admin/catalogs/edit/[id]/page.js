"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter, useParams } from "next/navigation";
import { CloseIcon } from "@/lib/icons";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function EditCatalog() {
  const { id } = useParams();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  if (typeof window !== "undefined" && sessionStorage.getItem("adminAuth") !== "true") {
    router.push("/admin/login");
    return null;
  }

  useEffect(() => {
    if (id) fetchCatalog();
  }, [id]);

  async function fetchCatalog() {
    setLoading(true);
    const { data: catalog, error } = await supabase
      .from("catalogs")
      .select("*")
      .eq("id", id)
      .single();
    if (error || !catalog) {
      setMessage("Catalog not found.");
      setLoading(false);
      return;
    }
    setTitle(catalog.title || "");

    const { data: imgs } = await supabase
      .from("catalog_images")
      .select("id, image_url, display_order")
      .eq("catalog_id", id)
      .order("display_order");
    setExistingImages(imgs || []);
    setLoading(false);
  }

  const handleNewImages = (e) => {
    const files = Array.from(e.target.files);
    if (existingImages.length + newImages.length + files.length > 6) {
      setMessage("Max 6 images total.");
      return;
    }
    setNewImages([...newImages, ...files]);
  };

  const removeNewImage = (idx) => {
    const updated = [...newImages];
    updated.splice(idx, 1);
    setNewImages(updated);
  };

  const deleteExistingImage = async (imageId, imageUrl) => {
    if (!confirm("Delete this image?")) return;
    const path = imageUrl.split("/public/")[1];
    if (path) await supabase.storage.from("catalog-bucket").remove([path]);
    await supabase.from("catalog_images").delete().eq("id", imageId);
    setExistingImages(existingImages.filter((i) => i.id !== imageId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const { error: updateError } = await supabase
        .from("catalogs")
        .update({ title })
        .eq("id", id);
      if (updateError) throw updateError;

      for (let i = 0; i < newImages.length; i++) {
        const file = newImages[i];
        const ext = file.name.split(".").pop();
        const fileName = `${id}_${Date.now()}_${i}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("catalog-bucket")
          .upload(fileName, file);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage
          .from("catalog-bucket")
          .getPublicUrl(fileName);
        await supabase.from("catalog_images").insert({
          catalog_id: id,
          image_url: urlData.publicUrl,
          display_order: existingImages.length + i,
        });
      }

      setMessage("Catalog updated successfully!");
      setNewImages([]);
      document.getElementById("newImages").value = "";
      fetchCatalog();
    } catch (err) {
      setMessage("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading catalog...</div>;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Edit Catalog</h1>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-white p-5 rounded-xl shadow-sm border">
          <h2 className="font-semibold text-lg mb-4">Catalog Details</h2>
          <div>
            <label className="block font-medium mb-1 text-sm">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border p-2 rounded"
              required
            />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border">
          <h2 className="font-semibold text-lg mb-4">Existing Images</h2>
          {existingImages.length === 0 ? (
            <p className="text-sm text-gray-500">No images.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {existingImages.map((img) => (
                <div key={img.id} className="relative border rounded p-2 bg-gray-50">
                  <img src={img.image_url} className="w-full h-24 object-cover rounded" alt="" />
                  <button
                    type="button"
                    onClick={() => deleteExistingImage(img.id, img.image_url)}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-700"
                  >
                    <CloseIcon className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border">
          <h2 className="font-semibold text-lg mb-4">Add New Images</h2>
          <input
            id="newImages"
            type="file"
            accept="image/*"
            multiple
            onChange={handleNewImages}
            className="w-full border p-2 rounded"
          />
          {newImages.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
              {newImages.map((file, idx) => (
                <div key={idx} className="relative border rounded p-2 bg-gray-50">
                  <img src={URL.createObjectURL(file)} className="w-full h-24 object-cover rounded" alt="" />
                  <button
                    type="button"
                    onClick={() => removeNewImage(idx)}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-700"
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
          className="w-full bg-amber-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-amber-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>

        {message && (
          <p className={`text-sm text-center ${message.startsWith("Error") ? "text-red-500" : "text-green-600"}`}>
            {message}
          </p>
        )}
      </form>

      <div className="mt-6 text-center">
        <a href="/admin/dashboard?tab=catalogs" className="text-amber-600 hover:underline text-sm">
          ← Back to Manage Catalogs
        </a>
      </div>
    </div>
  );
}
