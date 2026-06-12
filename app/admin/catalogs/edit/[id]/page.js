"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter, useParams } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function EditCatalog() {
  const { id } = useParams();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

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
    if (error) {
      setMessage("Catalog not found.");
      setLoading(false);
      return;
    }
    setTitle(catalog.title);
    setDescription(catalog.description);
    const { data: images } = await supabase
      .from("catalog_images")
      .select("id, image_url, display_order")
      .eq("catalog_id", id)
      .order("display_order");
    setExistingImages(images || []);
    setLoading(false);
  }

  async function removeImage(imageId, imageUrl) {
    if (!confirm("Remove this image?")) return;
    const path = imageUrl.split('/public/')[1];
    if (path) await supabase.storage.from("catalog-bucket").remove([path]);
    await supabase.from("catalog_images").delete().eq("id", imageId);
    fetchCatalog();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const { error: updateError } = await supabase
        .from("catalogs")
        .update({ title, description })
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
        const { data: urlData } = supabase.storage.from("catalog-bucket").getPublicUrl(fileName);
        await supabase.from("catalog_images").insert({
          catalog_id: id,
          image_url: urlData.publicUrl,
          display_order: existingImages.length + i,
        });
      }
      setMessage("Catalog updated successfully.");
      setNewImages([]);
      fetchCatalog();
    } catch (err) {
      setMessage("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Edit Catalog</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium mb-1">Title</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border p-2 rounded" required />
        </div>
        <div>
          <label className="block font-medium mb-1">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border p-2 rounded" rows="3" required />
        </div>
        <div>
          <label className="block font-medium mb-1">Existing Images</label>
          <div className="flex flex-wrap gap-2">
            {existingImages.map((img) => (
              <div key={img.id} className="relative">
                <img src={img.image_url} className="w-24 h-24 object-cover rounded" />
                <button type="button" onClick={() => removeImage(img.id, img.image_url)} className="absolute top-0 right-0 bg-red-600 text-white rounded-full w-5 h-5 text-xs">✕</button>
              </div>
            ))}
          </div>
        </div>
        <div>
          <label className="block font-medium mb-1">Add New Images (up to 6 total)</label>
          <input type="file" accept="image/*" multiple onChange={(e) => setNewImages(Array.from(e.target.files))} className="w-full border p-2 rounded" />
        </div>
        <button type="submit" disabled={saving} className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50">
          {saving ? "Saving..." : "Save Changes"}
        </button>
        {message && <p className={`mt-4 ${message.includes("Error") ? "text-red-500" : "text-green-500"}`}>{message}</p>}
      </form>
    </div>
  );
  }
