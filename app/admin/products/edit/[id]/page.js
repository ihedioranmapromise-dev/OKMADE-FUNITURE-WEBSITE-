"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter, useParams } from "next/navigation";
import { CloseIcon } from "@/lib/icons";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function EditProduct() {
  const { id } = useParams();
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [sold, setSold] = useState(false);
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
    if (id) fetchProduct();
  }, [id]);

  async function fetchProduct() {
    setLoading(true);
    const { data: product, error } = await supabase
      .from("showroom")
      .select("*")
      .eq("id", id)
      .single();
    if (error || !product) {
      setMessage("Product not found.");
      setLoading(false);
      return;
    }
    setDescription(product.description || "");
    setPrice(product.price || "");
    setSold(product.sold || false);

    const { data: imgs } = await supabase
      .from("product_images")
      .select("id, image_url, display_order, description")
      .eq("product_id", id)
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
    if (path) await supabase.storage.from("showroom-bucket").remove([path]);
    await supabase.from("product_images").delete().eq("id", imageId);
    setExistingImages(existingImages.filter((i) => i.id !== imageId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const { error: updateError } = await supabase
        .from("showroom")
        .update({
          description,
          price: price ? parseFloat(price) : null,
          sold,
        })
        .eq("id", id);
      if (updateError) throw updateError;

      for (let i = 0; i < newImages.length; i++) {
        const file = newImages[i];
        const ext = file.name.split(".").pop();
        const fileName = `products/${id}_${Date.now()}_${i}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("showroom-bucket")
          .upload(fileName, file);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage
          .from("showroom-bucket")
          .getPublicUrl(fileName);
        await supabase.from("product_images").insert({
          product_id: id,
          image_url: urlData.publicUrl,
          display_order: existingImages.length + i,
        });
      }

      setMessage("Product updated successfully!");
      setNewImages([]);
      document.getElementById("newImages").value = "";
      fetchProduct();
    } catch (err) {
      setMessage("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading product...</div>;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Edit Product</h1>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-white p-5 rounded-xl shadow-sm border">
          <h2 className="font-semibold text-lg mb-4">Product Details</h2>
          <div className="space-y-4">
            <div>
              <label className="block font-medium mb-1 text-sm">Description *</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border p-2 rounded"
                rows="3"
                required
              />
            </div>
            <div>
              <label className="block font-medium mb-1 text-sm">Price (₦) *</label>
              <input
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full border p-2 rounded"
                required
              />
            </div>
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={sold}
                  onChange={(e) => setSold(e.target.checked)}
                />
                <span className="text-sm">Mark as Sold</span>
              </label>
            </div>
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
        <a href="/admin/dashboard?tab=products" className="text-amber-600 hover:underline text-sm">
          ← Back to Manage Products
        </a>
      </div>
    </div>
  );
}
