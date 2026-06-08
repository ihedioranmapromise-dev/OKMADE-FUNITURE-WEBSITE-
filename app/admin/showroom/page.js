"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function ShowroomUpload() {
  const [image, setImage] = useState(null);
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [sold, setSold] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  // Check admin auth
  if (typeof window !== "undefined" && sessionStorage.getItem("adminAuth") !== "true") {
    router.push("/admin/login");
    return null;
  }

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image) {
      setMessage("Please select an image");
      return;
    }
    if (!description) {
      setMessage("Please enter a description");
      return;
    }
    if (!price) {
      setMessage("Please enter a price");
      return;
    }

    setUploading(true);
    setMessage("");

    try {
      // 1. Upload image to Supabase Storage
      const fileExt = image.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("showroom-bucket")
        .upload(filePath, image);

      if (uploadError) throw uploadError;

      // 2. Get public URL of uploaded image
      const { data: urlData } = supabase.storage
        .from("showroom-bucket")
        .getPublicUrl(filePath);
      const imageUrl = urlData.publicUrl;

      // 3. Insert product into showroom table
      const { error: insertError } = await supabase.from("showroom").insert([
        {
          image_url: imageUrl,
          description,
          price: parseFloat(price),
          sold,
        },
      ]);

      if (insertError) throw insertError;

      setMessage("Product uploaded successfully!");
      setImage(null);
      setDescription("");
      setPrice("");
      setSold(false);
      // Clear file input
      document.getElementById("imageInput").value = "";
    } catch (error) {
      setMessage("Error: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Add Product to Showroom</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium mb-1">Product Image</label>
          <input
            id="imageInput"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full border rounded p-2"
            required
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border rounded p-2"
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
            className="w-full border rounded p-2"
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
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {uploading ? "Uploading..." : "Add Product"}
        </button>
        {message && (
          <p className={`mt-4 ${message.includes("Error") ? "text-red-500" : "text-green-500"}`}>
            {message}
          </p>
        )}
      </form>
    </div>
  );
        }
