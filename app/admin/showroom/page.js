"use client";
import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function ShowroomUpload() {
  const [images, setImages] = useState([]);
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [sold, setSold] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  if (typeof window !== "undefined" && sessionStorage.getItem("adminAuth") !== "true") {
    router.push("/admin/login");
    return null;
  }

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 6) {
      setMessage("You can upload up to 6 images.");
      return;
    }
    setImages(files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (images.length === 0) {
      setMessage("Select at least one product image.");
      return;
    }
    if (!description || !price) {
      setMessage("Description and price are required.");
      return;
    }
    setUploading(true);
    setMessage("");

    try {
      // 1. Insert product into showroom table
      const { data: product, error: productError } = await supabase
        .from("showroom")
        .insert([{ description, price: parseFloat(price), sold }])
        .select()
        .single();
      if (productError) throw productError;

      // 2. Upload each image and insert into product_images
      for (let i = 0; i < images.length; i++) {
        const file = images[i];
        const ext = file.name.split(".").pop();
        const fileName = `products/${product.id}_${Date.now()}_${i}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("showroom-bucket")
          .upload(fileName, file);
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("showroom-bucket")
          .getPublicUrl(fileName);

        const { error: insertError } = await supabase
          .from("product_images")
          .insert({
            product_id: product.id,
            image_url: urlData.publicUrl,
            display_order: i,
          });
        if (insertError) throw insertError;
      }

      setMessage(`Product added with ${images.length} image(s).`);
      setImages([]);
      setDescription("");
      setPrice("");
      setSold(false);
      document.getElementById("productImages").value = "";
    } catch (err) {
      setMessage("Error: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Add Product to Showroom</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium mb-1">Product Images (up to 6)</label>
          <input
            id="productImages"
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            className="w-full border p-2 rounded"
            required
          />
          <p className="text-sm text-gray-500 mt-1">{images.length} file(s) selected</p>
        </div>
        <div>
          <label className="block font-medium mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border p-2 rounded"
            rows="3"
            required
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Price ($)</label>
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
            Mark as Sold
          </label>
        </div>
        <button
          type="submit"
          disabled={uploading}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {uploading ? "Uploading..." : "Add Product"}
        </button>
        {message && (
          <p className={`mt-4 ${message.startsWith("Error") ? "text-red-500" : "text-green-500"}`}>
            {message}
          </p>
        )}
      </form>
    </div>
  );
              }
