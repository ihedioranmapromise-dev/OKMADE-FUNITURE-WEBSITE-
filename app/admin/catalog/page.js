"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CatalogUpload() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState([]);
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
      setMessage("Maximum 6 images allowed.");
      return;
    }
    setImages(files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setMessage("Title and description are required.");
      return;
    }
    if (images.length === 0) {
      setMessage("Select at least one image.");
      return;
    }
    setUploading(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      images.forEach((img) => formData.append("images", img));

      const res = await fetch("/api/admin/add-catalog", {
        method: "POST",
        headers: { "x-admin-key": "okmade_super_secret_2026" },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage(`Catalog "${title}" added with ${images.length} image(s).`);
      setTitle("");
      setDescription("");
      setImages([]);
      document.getElementById("catalogImages").value = "";
    } catch (err) {
      setMessage("Error: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Add Catalog Space</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div><label className="block font-medium mb-1">Title *</label><input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border p-2 rounded" required /></div>
        <div><label className="block font-medium mb-1">Description *</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border p-2 rounded" rows="3" required /></div>
        <div><label className="block font-medium mb-1">Images (up to 6)</label><input id="catalogImages" type="file" accept="image/*" multiple onChange={handleImageChange} className="w-full border p-2 rounded" /><p className="text-sm text-gray-500 mt-1">{images.length} file(s) selected</p></div>
        <button type="submit" disabled={uploading} className="bg-purple-600 text-white px-4 py-2 rounded disabled:opacity-50">{uploading ? "Uploading..." : "Add Catalog Space"}</button>
        {message && <p className={`mt-4 ${message.startsWith("Error") ? "text-red-500" : "text-green-500"}`}>{message}</p>}
      </form>
    </div>
  );
                                                               }
