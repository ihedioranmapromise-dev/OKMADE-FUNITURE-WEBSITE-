"use client";
import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

export default function ShowroomUpload() {
  const [image, setImage] = useState(null);
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [sold, setSold] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  if (typeof window !== "undefined" && sessionStorage.getItem("adminAuth") !== "true") {
    router.push("/admin/login");
    return null;
  }

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) setImage(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image || !description || !price) {
      setMessage("Please fill all fields and select an image");
      return;
    }
    setUploading(true);
    setMessage("");
    try {
      const fileExt = image.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `products/${fileName}`;
      const { error: uploadError } = await supabase.storage.from("showroom-bucket").upload(filePath, image);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("showroom-bucket").getPublicUrl(filePath);
      const imageUrl = urlData.publicUrl;
      const { error: insertError } = await supabase.from("showroom").insert([{
        image_url: imageUrl,
        description,
        price: parseFloat(price),
        sold,
      }]);
      if (insertError) throw insertError;
      setMessage("Product uploaded!");
      setImage(null);
      setDescription("");
      setPrice("");
      setSold(false);
      document.getElementById("imageInput").value = "";
    } catch (err) {
      setMessage("Error: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Add Product</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input id="imageInput" type="file" accept="image/*" onChange={handleImageChange} required />
        <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" rows="3" className="w-full border p-2" required />
        <input type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} placeholder="Price" required />
        <label><input type="checkbox" checked={sold} onChange={e => setSold(e.target.checked)} /> Sold</label>
        <button type="submit" disabled={uploading} className="bg-blue-600 text-white p-2 rounded">{uploading ? "Uploading..." : "Add"}</button>
        {message && <p className={message.includes("Error") ? "text-red-500" : "text-green-500"}>{message}</p>}
      </form>
    </div>
  );
          }
