"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter, useParams } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function EditKilledProject() {
  const { id } = useParams();
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [workDescription, setWorkDescription] = useState("");
  const [city, setCity] = useState("");
  const [durationWeeks, setDurationWeeks] = useState("");
  const [projectDetails, setProjectDetails] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [price, setPrice] = useState("");
  const [existingImages, setExistingImages] = useState([]);
  const [newImageData, setNewImageData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  if (typeof window !== "undefined" && sessionStorage.getItem("adminAuth") !== "true") {
    router.push("/admin/login");
    return null;
  }

  useEffect(() => {
    if (id) fetchProject();
    fetchCategories();
  }, [id]);

  async function fetchCategories() {
    const { data } = await supabase.from("categories").select("*").order("name");
    setCategories(data || []);
  }

  async function fetchProject() {
    setLoading(true);
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .single();
    if (error || !data) {
      setMessage("Project not found.");
      setLoading(false);
      return;
    }
    setWorkDescription(data.work_description || "");
    setCity(data.city || "");
    setDurationWeeks(data.duration_weeks || "");
    setProjectDetails(data.project_details || "");
    setCategoryId(data.category_id || "");
    setPrice(data.price || "");

    const { data: imgs } = await supabase
      .from("project_request_images")
      .select("id, image_url, display_order, description")
      .eq("project_id", id)
      .order("display_order");
    setExistingImages(imgs || []);
    setLoading(false);
  }

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (existingImages.length + newImageData.length + files.length > 6) {
      setMessage("You can have up to 6 images total.");
      return;
    }
    const newImages = files.map((file) => ({ file, description: "" }));
    setNewImageData([...newImageData, ...newImages]);
  };

  const handleNewDescriptionChange = (index, value) => {
    const updated = [...newImageData];
    updated[index].description = value;
    setNewImageData(updated);
  };

  const removeNewImage = (index) => {
    const updated = [...newImageData];
    updated.splice(index, 1);
    setNewImageData(updated);
  };

  const deleteExistingImage = async (imageId, imageUrl) => {
    if (!confirm("Delete this image?")) return;
    const path = imageUrl.split("/public/")[1];
    if (path) {
      await supabase.storage.from("workspace-requests").remove([path]);
    }
    await supabase.from("project_request_images").delete().eq("id", imageId);
    setExistingImages(existingImages.filter((img) => img.id !== imageId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const { error: updateError } = await supabase
        .from("projects")
        .update({
          work_description: workDescription,
          city: city || null,
          duration_weeks: durationWeeks ? parseInt(durationWeeks) : null,
          project_details: projectDetails || null,
          category_id: categoryId || null,
          price: price ? parseFloat(price) : null,
        })
        .eq("id", id);
      if (updateError) throw updateError;

      // Upload new images
      for (let i = 0; i < newImageData.length; i++) {
        const { file, description: imgDesc } = newImageData[i];
        const ext = file.name.split(".").pop();
        const fileName = `requests/${id}_${Date.now()}_${i}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("workspace-requests")
          .upload(fileName, file);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage
          .from("workspace-requests")
          .getPublicUrl(fileName);
        await supabase.from("project_request_images").insert({
          project_id: id,
          image_url: urlData.publicUrl,
          display_order: existingImages.length + i,
          description: imgDesc || null,
        });
      }

      setMessage("Project updated successfully!");
      setNewImageData([]);
      document.getElementById("newImages").value = "";
      fetchProject();
    } catch (err) {
      setMessage("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading project...</div>;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Edit Killed Project</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium mb-1">Work Description (Title) *</label>
          <textarea
            value={workDescription}
            onChange={(e) => setWorkDescription(e.target.value)}
            className="w-full border p-2 rounded"
            rows="2"
            required
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-medium mb-1">City</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full border p-2 rounded"
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Duration (weeks)</label>
            <input
              type="number"
              value={durationWeeks}
              onChange={(e) => setDurationWeeks(e.target.value)}
              className="w-full border p-2 rounded"
            />
          </div>
        </div>
        <div>
          <label className="block font-medium mb-1">Category</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full border p-2 rounded"
          >
            <option value="">-- Select Category --</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-medium mb-1">Project Details</label>
          <textarea
            value={projectDetails}
            onChange={(e) => setProjectDetails(e.target.value)}
            className="w-full border p-2 rounded"
            rows="5"
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Price (₦)</label>
          <input
            type="number"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full border p-2 rounded"
          />
        </div>

        {/* Existing images */}
        <div>
          <label className="block font-medium mb-2">Existing Images</label>
          {existingImages.length === 0 ? (
            <p className="text-sm text-gray-500">No images.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {existingImages.map((img) => (
                <div key={img.id} className="relative border rounded p-2 bg-gray-50">
                  <img
                    src={img.image_url}
                    className="w-full h-24 object-cover rounded"
                    alt="Existing"
                  />
                  <button
                    type="button"
                    onClick={() => deleteExistingImage(img.id, img.image_url)}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-700"
                  >
                    ✕
                  </button>
                  {img.description && (
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      {img.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* New images */}
        <div>
          <label className="block font-medium mb-1">Add New Images</label>
          <input
            id="newImages"
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            className="w-full border p-2 rounded"
          />
          {newImageData.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
              {newImageData.map((item, idx) => (
                <div key={idx} className="relative border rounded p-2 bg-gray-50">
                  <img
                    src={URL.createObjectURL(item.file)}
                    className="w-full h-24 object-cover rounded"
                    alt="New"
                  />
                  <input
                    type="text"
                    placeholder="Description (optional)"
                    value={item.description}
                    onChange={(e) =>
                      handleNewDescriptionChange(idx, e.target.value)
                    }
                    className="w-full mt-1 p-1 border rounded text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => removeNewImage(idx)}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-amber-600 text-white px-4 py-3 rounded font-semibold hover:bg-amber-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>

        {message && (
          <p className={`text-sm ${message.startsWith("Error") ? "text-red-500" : "text-green-600"}`}>
            {message}
          </p>
        )}
      </form>

      <div className="mt-6 text-center">
        <a href="/admin/testimonials" className="text-amber-600 hover:underline text-sm">
          ← Back to Manage Portfolio
        </a>
      </div>
    </div>
  );
}
