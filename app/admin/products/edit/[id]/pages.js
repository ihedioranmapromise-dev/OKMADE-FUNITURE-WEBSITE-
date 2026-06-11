"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter, useParams } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function EditProduct() {
  const { id } = useParams();
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [sold, setSold] = useState(false);
  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (id) fetchProduct();
  }, [id]);

  async function fetchProduct() {
    setLoading(true);
    // Fetch product details
    const { data: product, error } = await supabase
      .from("showroom")
      .select("*")
      .eq("id", id)
      .single();
    if (error) {
      setMessage("Product not found.");
      setLoading(false);
      return;
    }
    setDescription(product.description);
    setPrice(product.price);
    setSold(product.sold);
    // Fetch existing images
    const { data: images } = await supabase
      .from("product_images")
      .select("id, image_url, display_order")
      .eq("product_id", id)
      .order("display_order");
    setExistingImages(images || []);
    setLoading(false);
  }

  async function removeImage(imageId, imageUrl) {
    if (!confirm("Remove this image?")) return;
    // Delete from storage
    const path = imageUrl.split('/public/')[1];
    if (path) await supabase.storage.from("showroom-bucket").remove([path]);
    // Delete from database
    await supabase.from("product_images").delete().eq("id", imageId);
    // Refresh
    fetchProduct();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      // Update product details
      const { error: updateError } = await supabase
        .from("showroom")
        .update({ description, price: parseFloat(price), sold })
        .eq("id", id);
      if (updateError) throw updateError;

      // Upload new images
      for (let i = 0; i < newImages.length; i++) {
        const file = newImages[i];
        const ext = file.name.split(".").pop();
        const fileName = `products/${id}_${Date.now()}_${i}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("showroom-bucket")
          .upload(fileName, file);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("showroom-bucket").getPublicUrl(fileName);
        await supabase.from("product_images").insert({
          product_id: id,
          image_url: urlData.publicUrl,
          display_order: existingImages.length + i,
        });
      }
      setMessage("Product updated successfully.");
      setNewImages([]);
      fetchProduct(); // refresh images
    } catch (err) {
      setMessage("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Edit Product</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium mb-1">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border p-2 rounded" rows="3" required />
        </div>
        <div>
          <label className="block font-medium mb-1">Price (₦)</label>
          <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full border p-2 rounded" required />
        </div>
        <div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={sold} onChange={(e) => setSold(e.target.checked)} />
            Mark as Sold
          </label>
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
