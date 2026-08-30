"use client";
import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function CatalogUpload() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageData, setImageData] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  if (typeof window !== "undefined" && sessionStorage.getItem("adminAuth") !== "true") {
    router.push("/admin/login");
    return null;
  }

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (imageData.length + files.length > 6) {
      setMessage("You can upload up to 6 images total.");
      return;
    }
    const newImages = files.map((file) => ({ file, description: "" }));
    setImageData([...imageData, ...newImages]);
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
    if (!title.trim() || !description.trim()) {
      setMessage("Title and description are required.");
      return;
    }
    if (imageData.length === 0) {
      setMessage("Select at least one image.");
      return;
    }
    setUploading(true);
    setMessage("");

    try {
      const { data: catalog, error: catalogError } = await supabase
        .from("catalogs")
        .insert([{ title, description }])
        .select()
        .single();
      if (catalogError) throw catalogError;

      for (let i = 0; i < imageData.length; i++) {
        const { file, description: imgDesc } = imageData[i];
        const ext = file.name.split(".").pop();
        const fileName = `${catalog.id}_${Date.now()}_${i}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("catalog-bucket")
          .upload(fileName, file);
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("catalog-bucket")
          .getPublicUrl(fileName);

        await supabase.from("catalog_images").insert({
          catalog_id: catalog.id,
          image_url: urlData.publicUrl,
          display_order: i,
          description: imgDesc || null,
        });
      }

      setMessage(`Catalog "${title}" added with ${imageData.length} image(s).`);
      setTitle("");
      setDescription("");
      setImageData([]);
      document.getElementById("catalogImages").value = "";
    } catch (err) {
      setMessage("Error: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Add Catalog Space</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium mb-1">Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border p-2 rounded"
            required
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Description *</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border p-2 rounded"
            rows="3"
            required
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Images (up to 6)</label>
          <input
            id="catalogImages"
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
                  <img
                    src={URL.createObjectURL(item.file)}
                    className="w-full h-24 object-cover rounded"
                    alt="Preview"
                  />
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
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
          <p className="text-sm text-gray-500 mt-1">{imageData.length} file(s) selected</p>
        </div>
        <button
          type="submit"
          disabled={uploading}
          className="bg-purple-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {uploading ? "Uploading..." : "Add Catalog Space"}
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