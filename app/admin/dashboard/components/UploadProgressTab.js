"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { CloseIcon } from "@/lib/icons";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function UploadProgressTab() {
  const [projects, setProjects] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedProjectLabel, setSelectedProjectLabel] = useState("");
  const [selectedWorkerId, setSelectedWorkerId] = useState("");
  const [overallDescription, setOverallDescription] = useState("");
  const [imageData, setImageData] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [progressData, setProgressData] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editExplanation, setEditExplanation] = useState("");

  useEffect(() => {
    fetchProjects();
    fetchWorkers();
  }, []);

  async function fetchProjects() {
    const { data } = await supabase
      .from("projects")
      .select("id, token_string, work_description, client_name, is_standalone, client_id, city")
      .eq("status", "active")
      .order("created_at", { ascending: false });
    setProjects(data || []);
  }

  async function fetchWorkers() {
    const res = await fetch("/api/admin/workers", {
      headers: {
        "x-admin-key":
          process.env.NEXT_PUBLIC_ADMIN_API_KEY || "okmade_super_secret_2026",
      },
    });
    if (res.ok) setWorkers((await res.json()) || []);
  }

  const handleProjectChange = async (e) => {
    const id = e.target.value;
    const project = projects.find((p) => p.id === id);
    setSelectedProjectId(id);
    setSelectedProjectLabel(
      project
        ? `${project.work_description || "Untitled"} ${
            project.token_string ? `(#${project.token_string})` : "(Standalone)"
          }`
        : ""
    );
    setSelectedWorkerId(project ? project.client_id : "");
    if (id) {
      const { data } = await supabase
        .from("progress_images")
        .select("*")
        .eq("project_id", id)
        .order("created_at", { ascending: false });
      setProgressData(data || []);
    } else setProgressData([]);
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (imageData.length + files.length > 6) {
      setMessage("You can upload up to 6 progress images total.");
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

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedProjectId || imageData.length === 0) {
      setMessage("Select a project and at least one image.");
      return;
    }
    setUploading(true);
    setMessage("");
    try {
      for (let i = 0; i < imageData.length; i++) {
        const { file, description: imgDesc } = imageData[i];
        const ext = file.name.split(".").pop();
        const fileName = `progress/${selectedProjectId}_${Date.now()}_${i}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("workspace-progress")
          .upload(fileName, file);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("workspace-progress").getPublicUrl(fileName);
        await supabase.from("progress_images").insert({
          project_id: selectedProjectId,
          image_url: urlData.publicUrl,
          description: imgDesc || null,
          explanation: overallDescription || null,
          uploaded_by: null,
        });
      }

      if (selectedWorkerId) {
        await supabase.from("notifications").insert({
          client_id: selectedWorkerId,
          type: "progress_uploaded",
          message: `New progress update on project "${selectedProjectLabel}".`,
          target_url: `/workspace/${selectedProjectLabel.split("#")[1]?.replace(")", "") || ""}`,
        });
      }

      setMessage(`Uploaded ${imageData.length} progress image(s).`);
      setImageData([]);
      setOverallDescription("");
      document.getElementById("progressImages").value = "";
      const { data } = await supabase
        .from("progress_images")
        .select("*")
        .eq("project_id", selectedProjectId)
        .order("created_at", { ascending: false });
      setProgressData(data || []);
    } catch (err) {
      setMessage("Error: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleEditExplanation = async (id) => {
    if (!editExplanation.trim()) return;
    await supabase.from("progress_images").update({ explanation: editExplanation }).eq("id", id);
    setEditingId(null);
    setEditExplanation("");
    const { data } = await supabase
      .from("progress_images")
      .select("*")
      .eq("project_id", selectedProjectId)
      .order("created_at", { ascending: false });
    setProgressData(data || []);
    setMessage("Explanation updated.");
  };

  const handleDeleteImage = async (imageId, imageUrl) => {
    if (!confirm("Delete this image?")) return;
    const path = imageUrl.split("/public/")[1];
    if (path) await supabase.storage.from("workspace-progress").remove([path]);
    await supabase.from("progress_images").delete().eq("id", imageId);
    const { data } = await supabase
      .from("progress_images")
      .select("*")
      .eq("project_id", selectedProjectId)
      .order("created_at", { ascending: false });
    setProgressData(data || []);
    setMessage("Image deleted.");
  };

  const handleKill = async () => {
    if (!selectedProjectId) {
      setMessage("Select a project first.");
      return;
    }
    if (!confirm("Mark project as complete? This will publish it to the portfolio.")) return;
    setUploading(true);

    // Grab the project details before status change for the auto-post
    const project = projects.find((p) => p.id === selectedProjectId);

    const { error } = await supabase
      .from("projects")
      .update({ status: "killed" })
      .eq("id", selectedProjectId);

    if (error) {
      setMessage("Error: " + error.message);
      setUploading(false);
      return;
    }

    // Notify the assigned worker if any
    if (selectedWorkerId) {
      await supabase.from("notifications").insert({
        client_id: selectedWorkerId,
        type: "project_killed",
        message: `Project "${selectedProjectLabel}" has been marked as completed.`,
        target_url: `/workspace/${selectedProjectLabel.split("#")[1]?.replace(")", "") || ""}`,
      });
    }

    // Auto-post to OKMADE feed
    try {
      const { data: okmade } = await supabase
        .from("clients")
        .select("id")
        .eq("is_okmade", true)
        .single();

      if (okmade) {
        // Grab project request images (up to 4)
        const { data: reqImgs } = await supabase
          .from("project_request_images")
          .select("image_url")
          .eq("project_id", selectedProjectId)
          .limit(4);

        const cityPart = project?.city ? ` in ${project.city}` : "";
        const content = `✅ Completed project: ${project?.work_description || "Untitled"}${cityPart}`;

        await supabase.from("posts").insert([
          {
            author_id: okmade.id,
            content,
            image_urls: (reqImgs || []).map((i) => i.image_url),
            is_auto: true,
            auto_source: "project_killed",
            auto_source_id: selectedProjectId,
          },
        ]);
      }
    } catch (postErr) {
      console.error("Auto-post failed:", postErr);
    }

    setMessage("Project completed and published to portfolio.");
    fetchProjects();
    setSelectedProjectId("");
    setSelectedProjectLabel("");
    setProgressData([]);
    setUploading(false);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Upload Progress & Manage Projects</h1>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block font-medium mb-1 text-sm">Select Active Project</label>
            <select value={selectedProjectId} onChange={handleProjectChange} className="w-full border p-2 rounded">
              <option value="">-- Choose a project --</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.work_description || "Untitled"} {p.token_string ? `(#${p.token_string})` : "(Standalone)"}
                  {p.client_name ? ` – ${p.client_name}` : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-medium mb-1 text-sm">Overall Description / Notes</label>
            <textarea value={overallDescription} onChange={(e) => setOverallDescription(e.target.value)} rows="3" className="w-full border p-2 rounded" />
          </div>
          <div>
            <label className="block font-medium mb-1 text-sm">Progress Images (up to 6)</label>
            <input id="progressImages" type="file" accept="image/*" multiple onChange={handleImageChange} className="w-full border p-2 rounded" />
            {imageData.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                {imageData.map((item, idx) => (
                  <div key={idx} className="relative border rounded p-2 bg-gray-50">
                    <img src={URL.createObjectURL(item.file)} className="w-full h-24 object-cover rounded" alt="Preview" />
                    <input type="text" placeholder="Image description (optional)" value={item.description} onChange={(e) => handleDescriptionChange(idx, e.target.value)} className="w-full mt-1 p-1 border rounded text-sm" />
                    <button type="button" onClick={() => removeImage(idx)} className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-700">
                      <CloseIcon className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={uploading} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium disabled:opacity-50 transition">
              {uploading ? "Uploading..." : "Upload Progress"}
            </button>
            <button type="button" onClick={handleKill} disabled={uploading || !selectedProjectId} className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-lg font-medium disabled:opacity-50 transition">
              Mark Complete & Publish
            </button>
          </div>
          {message && <p className={`text-sm ${message.startsWith("Error") ? "text-red-500" : "text-green-600"}`}>{message}</p>}
        </form>
      </div>

      {progressData.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">Uploaded Progress</h2>
          <div className="space-y-6">
            {progressData.map((item) => {
              const isClient = item.uploaded_by !== null;
              let uploaderName = "Admin";
              if (isClient) {
                const worker = workers.find((w) => w.id === item.uploaded_by);
                uploaderName = worker ? worker.display_name || worker.username || "Client" : "Client";
              }
              return (
                <div key={item.id} className="border-b pb-4 last:border-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        {isClient ? "Client" : "Admin"} – {uploaderName}
                      </p>
                      <p className="text-sm text-gray-500">{new Date(item.created_at).toLocaleString()}</p>
                      {item.description && <p className="text-sm text-gray-600"><strong>Image desc:</strong> {item.description}</p>}
                      {item.explanation && <p className="text-sm text-gray-600"><strong>Overall note:</strong> {item.explanation}</p>}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingId(item.id); setEditExplanation(item.explanation || ""); }} className="text-blue-600 hover:underline text-sm">Edit Note</button>
                      <button onClick={() => handleDeleteImage(item.id, item.image_url)} className="text-red-600 hover:underline text-sm">Delete</button>
                    </div>
                  </div>
                  <img src={item.image_url} className="w-full max-h-60 object-cover rounded-lg mt-2" alt="Progress" />
                  {editingId === item.id && (
                    <div className="mt-2 flex gap-2">
                      <textarea value={editExplanation} onChange={(e) => setEditExplanation(e.target.value)} rows="2" className="flex-1 border p-2 rounded" />
                      <button onClick={() => handleEditExplanation(item.id)} className="bg-green-600 text-white px-3 py-1 rounded">Save</button>
                      <button onClick={() => setEditingId(null)} className="bg-gray-300 px-3 py-1 rounded">Cancel</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
