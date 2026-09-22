"use client";
import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { CloseIcon } from "@/lib/icons";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function AddShowroomTab() {
  const [imageData, setImageData] = useState([]);
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [sold, setSold] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (imageData.length + files.length > 6) {
      setMessage("You can upload up to 6 images total.");
      return;
    }
    setImageData([...imageData, ...files.map((file) => ({ file, description: "" }))]);
  };

  const handleDescriptionChange = (index, value) => {
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
      const { data: product, error: productError } = await supabase
        .from("showroom")
        .insert([{ description, price: parseFloat(price), sold }])
        .select()
        .single();
      if (productError) throw productError;

      for (let i = 0; i < imageData.length; i++) {
        const { file, description: imgDesc } = imageData[i];
        const ext = file.name.split(".").pop();
        const fileName = `products/${product.id}_${Date.now()}_${i}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("showroom-bucket")
          .upload(fileName, file);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage
          .from("showroom-bucket")
          .getPublicUrl(fileName);
        await supabase.from("product_images").insert({
          product_id: product.id,
          image_url: urlData.publicUrl,
          display_order: i,
          description: imgDesc || null,
        });
      }

      setMessage(`Product added with ${imageData.length} image(s).`);
      setImageData([]);
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
    <div>
      <h1 className="text-2xl font-bold mb-6 text-gray-800">
        Add Product to Showroom
      </h1>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
        <div>
          <label className="block font-medium mb-1 text-sm">Product Images (up to 6)</label>
          <input
            id="productImages"
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            className="w-full border p-2 rounded"
          />
          {imageData.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
              {imageData.map((item, idx) => (
                <div key={idx} className="relative border rounded p-2 bg-gray-50">
                  <img src={URL.createObjectURL(item.file)} className="w-full h-24 object-cover rounded" alt="Preview" />
                  <input
                    type="text"
                    placeholder="Image description (optional)"
                    value={item.description}
                    onChange={(e) => handleDescriptionChange(idx, e.target.value)}
                    className="w-full mt-1 p-1 border rounded text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-700"
                  >
                    <CloseIcon className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block font-medium mb-1 text-sm">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border p-2 rounded" rows="3" />
        </div>

        <div>
          <label className="block font-medium mb-1 text-sm">Price (₦)</label>
          <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full border p-2 rounded" />
        </div>

        <div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={sold} onChange={(e) => setSold(e.target.checked)} />
            <span className="text-sm">Mark as Sold</span>
          </label>
        </div>

        <button type="submit" disabled={uploading} className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-lg font-medium disabled:opacity-50 transition">
          {uploading ? "Uploading..." : "Add Product"}
        </button>

        {message && <p className={`text-sm ${message.startsWith("Error") ? "text-red-500" : "text-green-600"}`}>{message}</p>}
      </form>
    </div>
  );
}
