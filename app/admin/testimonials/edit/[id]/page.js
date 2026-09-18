"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter, useParams } from "next/navigation";
import { CloseIcon } from "@/lib/icons";

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
  const [requestImages, setRequestImages] = useState([]);
  const [progressImages, setProgressImages] = useState([]);
  const [newRequestImages, setNewRequestImages] = useState([]);
  const [newProgressImages, setNewProgressImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [editingProgressId, setEditingProgressId] = useState(null);
  const [editDesc, setEditDesc] = useState("");
  const [editExp, setEditExp] = useState("");

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

    const { data: reqImgs } = await supabase
      .from("project_request_images")
      .select("id, image_url, display_order, description")
      .eq("project_id", id)
      .order("display_order");
    setRequestImages(reqImgs || []);

    const { data: progImgs } = await supabase
      .from("progress_images")
      .select("id, image_url, description, explanation, created_at")
      .eq("project_id", id)
      .order("created_at", { ascending: true });
    setProgressImages(progImgs || []);

    setLoading(false);
  }

  const handleRequestImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (requestImages.length + newRequestImages.length + files.length > 6) {
      setMessage("You can have up to 6 request images total.");
      return;
    }
    setNewRequestImages([...newRequestImages, ...files]);
  };

  const removeNewRequestImage = (index) => {
    const updated = [...newRequestImages];
    updated.splice(index, 1);
    setNewRequestImages(updated);
  };

  const deleteRequestImage = async (imageId, imageUrl) => {
    if (!confirm("Delete this request image?")) return;
    const path = imageUrl.split("/public/")[1];
    if (path) await supabase.storage.from("workspace-requests").remove([path]);
    await supabase.from("project_request_images").delete().eq("id", imageId);
    setRequestImages(requestImages.filter((img) => img.id !== imageId));
  };

  const handleProgressImageChange = (e) => {
    const files = Array.from(e.target.files);
    setNewProgressImages([...newProgressImages, ...files]);
  };

  const removeNewProgressImage = (index) => {
    const updated = [...newProgressImages];
    updated.splice(index, 1);
    setNewProgressImages(updated);
  };

  const deleteProgressImage = async (imageId, imageUrl) => {
    if (!confirm("Delete this progress image?")) return;
    const path = imageUrl.split("/public/")[1];
    if (path) await supabase.storage.from("workspace-progress").remove([path]);
    await supabase.from("progress_images").delete().eq("id", imageId);
    setProgressImages(progressImages.filter((img) => img.id !== imageId));
  };

  const startEditProgress = (img) => {
    setEditingProgressId(img.id);
    setEditDesc(img.description || "");
    setEditExp(img.explanation || "");
  };

  const cancelEditProgress = () => {
    setEditingProgressId(null);
    setEditDesc("");
    setEditExp("");
  };

  const saveProgressEdit = async () => {
    try {
      const { error } = await supabase
        .from("progress_images")
        .update({ description: editDesc, explanation: editExp })
        .eq("id", editingProgressId);
      if (error) throw error;
      setProgressImages((prev) =>
        prev.map((img) =>
          img.id === editingProgressId
            ? { ...img, description: editDesc, explanation: editExp }
            : img
        )
      );
      cancelEditProgress();
      setMessage("Progress description updated.");
    } catch (err) {
      setMessage("Error: " + err.message);
    }
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

      for (let i = 0; i < newRequestImages.length; i++) {
        const file = newRequestImages[i];
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
          display_order: requestImages.length + i,
        });
      }

      for (let i = 0; i < newProgressImages.length; i++) {
        const file = newProgressImages[i];
        const ext = file.name.split(".").pop();
        const fileName = `progress/${id}_${Date.now()}_${i}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("workspace-progress")
          .upload(fileName, file);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage
          .from("workspace-progress")
          .getPublicUrl(fileName);
        await supabase.from("progress_images").insert({
          project_id: id,
          image_url: urlData.publicUrl,
          description: null,
          explanation: null,
          uploaded_by: null,
        });
      }

      setMessage("Project updated successfully!");
      setNewRequestImages([]);
      setNewProgressImages([]);
      document.getElementById("newRequestImages").value = "";
      document.getElementById("newProgressImages").value = "";
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
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-5 rounded-xl shadow-sm border">
          <h2 className="font-semibold text-lg mb-4">Project Details</h2>
          <div className="space-y-4">
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
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border">
          <h2 className="font-semibold text-lg mb-1">Request / Concept Images</h2>
          <p className="text-sm text-gray-500 mb-4">
            The original images the client requested (shown first on the workspace page).
          </p>
          {requestImages.length === 0 ? (
            <p className="text-sm text-gray-500">No request images.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              {requestImages.map((img) => (
                <div key={img.id} className="relative border rounded p-2 bg-gray-50">
                  <img
                    src={img.image_url}
                    className="w-full h-24 object-cover rounded"
                    alt="Request"
                  />
                  <button
                    type="button"
                    onClick={() => deleteRequestImage(img.id, img.image_url)}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-700"
                  >
                    <CloseIcon className="w-3 h-3" />
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
          <label className="block font-medium mb-1 text-sm">Add New Request Images</label>
          <input
            id="newRequestImages"
            type="file"
            accept="image/*"
            multiple
            onChange={handleRequestImageChange}
            className="w-full border p-2 rounded"
          />
          {newRequestImages.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
              {newRequestImages.map((file, idx) => (
                <div key={idx} className="relative border rounded p-2 bg-gray-50">
                  <img
                    src={URL.createObjectURL(file)}
                    className="w-full h-24 object-cover rounded"
                    alt="New"
                  />
                  <button
                    type="button"
                    onClick={() => removeNewRequestImage(idx)}
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
          <h2 className="font-semibold text-lg mb-1">Progress / Final Images</h2>
          <p className="text-sm text-gray-500 mb-4">
            The work-in-progress and final result images. Edit their descriptions or delete them.
          </p>
          {progressImages.length === 0 ? (
            <p className="text-sm text-gray-500">No progress images yet.</p>
          ) : (
            <div className="space-y-4">
              {progressImages.map((img) => {
                const isEditing = editingProgressId === img.id;
                return (
                  <div
                    key={img.id}
                    className="border rounded-lg p-3 bg-gray-50 flex flex-col md:flex-row gap-3"
                  >
                    <img
                      src={img.image_url}
                      className="w-full md:w-40 h-40 object-cover rounded"
                      alt="Progress"
                    />
                    <div className="flex-1">
                      {isEditing ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            placeholder="Short description"
                            value={editDesc}
                            onChange={(e) => setEditDesc(e.target.value)}
                            className="w-full border p-2 rounded text-sm"
                          />
                          <textarea
                            placeholder="Full explanation"
                            value={editExp}
                            onChange={(e) => setEditExp(e.target.value)}
                            rows="3"
                            className="w-full border p-2 rounded text-sm"
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={saveProgressEdit}
                              className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={cancelEditProgress}
                              className="bg-gray-300 px-3 py-1 rounded text-sm hover:bg-gray-400"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {img.description && (
                            <p className="text-sm font-medium text-gray-700">
                              {img.description}
                            </p>
                          )}
                          {img.explanation && (
                            <p className="text-xs text-gray-500 mt-1">
                              {img.explanation}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-2">
                            {new Date(img.created_at).toLocaleString()}
                          </p>
                          <div className="flex gap-2 mt-2">
                            <button
                              type="button"
                              onClick={() => startEditProgress(img)}
                              className="text-blue-600 hover:underline text-sm"
                            >
                              Edit Description
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteProgressImage(img.id, img.image_url)}
                              className="text-red-600 hover:underline text-sm"
                            >
                              Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="mt-4">
            <label className="block font-medium mb-1 text-sm">Add New Progress Images</label>
            <input
              id="newProgressImages"
              type="file"
              accept="image/*"
              multiple
              onChange={handleProgressImageChange}
              className="w-full border p-2 rounded"
            />
            {newProgressImages.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                {newProgressImages.map((file, idx) => (
                  <div key={idx} className="relative border rounded p-2 bg-gray-50">
                    <img
                      src={URL.createObjectURL(file)}
                      className="w-full h-24 object-cover rounded"
                      alt="New Progress"
                    />
                    <button
                      type="button"
                      onClick={() => removeNewProgressImage(idx)}
                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-700"
                    >
                      <CloseIcon className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-amber-600 text-white px-4 py-3 rounded font-semibold hover:bg-amber-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save All Changes"}
        </button>

        {message && (
          <p
            className={`text-sm text-center ${
              message.startsWith("Error") ? "text-red-500" : "text-green-600"
            }`}
          >
            {message}
          </p>
        )}
      </form>

      <div className="mt-6 text-center">
        <a href="/admin/dashboard?tab=portfolio" className="text-amber-600 hover:underline text-sm">
          ← Back to Manage Portfolio
        </a>
      </div>
    </div>
  );
}
