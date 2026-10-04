"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { adminFetch } from "@/lib/admin-client";
import AutoPostModal from "@/app/components/AutoPostModal";

const STATUS_OPTIONS = ["pending", "in-progress", "complete"];

const CloseIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const PlusIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);

export default function UploadProgressTab() {
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedWorkerId, setSelectedWorkerId] = useState("");
  const [overallDescription, setOverallDescription] = useState("");
  const [imageData, setImageData] = useState([]);
  const [progressData, setProgressData] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [timelineDirty, setTimelineDirty] = useState(false);
  const [timelineSaving, setTimelineSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editExplanation, setEditExplanation] = useState("");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const [autoPostOpen, setAutoPostOpen] = useState(false);
  const [autoPostData, setAutoPostData] = useState({
    type: "project",
    sourceId: "",
    defaultContent: "",
    previewImages: [],
  });

  const key = () => sessionStorage.getItem("adminKey") || "";

  useEffect(() => {
    loadProjects();
    loadWorkers();
  }, []);

  async function loadProjects() {
    try {
      const res = await fetch("/api/admin/projects/list?status=active", {
        headers: { "x-admin-key": key() },
      });
      if (res.ok) setProjects((await res.json()) || []);
    } catch {}
  }

  async function loadWorkers() {
    try {
      const res = await fetch("/api/admin/workers", {
        headers: { "x-admin-key": key() },
      });
      if (res.ok) setWorkers((await res.json()) || []);
    } catch {}
  }

  async function loadProjectDetails(id) {
    try {
      const [progRes, projRes] = await Promise.all([
        adminFetch(`/api/admin/progress-images?project_id=${id}`),
        adminFetch(`/api/admin/timeline?project_id=${id}`),
      ]);
      if (progRes.ok) setProgressData((await progRes.json()) || []);
      if (projRes.ok) {
        const d = await projRes.json();
        setTimeline(Array.isArray(d.timeline) ? d.timeline : []);
      }
      setTimelineDirty(false);
    } catch {}
  }

  const handleProjectChange = async (e) => {
    const id = e.target.value;
    setSelectedProjectId(id);
    const p = projects.find((x) => x.id === id);
    setSelectedProject(p || null);
    setSelectedWorkerId(p?.client_id || "");
    if (id) await loadProjectDetails(id);
    else {
      setProgressData([]);
      setTimeline([]);
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (imageData.length + files.length > 6) {
      setMessage("Max 6 images per upload batch.");
      return;
    }
    setImageData([
      ...imageData,
      ...files.map((file) => ({ file, description: "" })),
    ]);
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
      // Upload images to storage
      const uploaded = [];
      for (let i = 0; i < imageData.length; i++) {
        const { file, description } = imageData[i];
        const ext = file.name.split(".").pop();
        const path = `progress/${selectedProjectId}_${Date.now()}_${i}.${ext}`;
        // Get signed upload via supabase-js using anon key — storage policy allows authenticated upload
        const { createClient } = await import("@supabase/supabase-js");
        const sb = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );
        const { error: upErr } = await sb.storage
          .from("workspace-progress")
          .upload(path, file, { cacheControl: "31536000" });
        if (upErr) throw upErr;
        const { data: urlData } = sb.storage.from("workspace-progress").getPublicUrl(path);
        uploaded.push({ url: urlData.publicUrl, description: description || null });
      }

      const res = await adminFetch("/api/admin/progress-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: selectedProjectId,
          images: uploaded,
          explanation: overallDescription || null,
        }),
      });
      if (!res.ok) throw new Error("Upload failed");

      if (selectedWorkerId) {
        try {
          await adminFetch("/api/admin/notify-user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              client_id: selectedWorkerId,
              message: `New progress update on "${selectedProject?.work_description || "your project"}".`,
              target_url: selectedProject?.token_string
                ? `/workspace/${selectedProject.token_string}`
                : null,
            }),
          });
        } catch {}
      }

      setMessage(`Uploaded ${imageData.length} image(s).`);
      setImageData([]);
      setOverallDescription("");
      const el = document.getElementById("progressImages");
      if (el) el.value = "";
      await loadProjectDetails(selectedProjectId);
    } catch (err) {
      setMessage("Error: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleEditExplanation = async (id) => {
    if (!editExplanation.trim()) return;
    const res = await adminFetch("/api/admin/progress-images", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, explanation: editExplanation }),
    });
    if (res.ok) {
      setEditingId(null);
      setEditExplanation("");
      await loadProjectDetails(selectedProjectId);
      setMessage("Explanation updated.");
    } else {
      setMessage("Failed to update.");
    }
  };

  const handleDeleteImage = async (id) => {
    if (!confirm("Delete this image?")) return;
    const res = await adminFetch(`/api/admin/progress-images?id=${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      await loadProjectDetails(selectedProjectId);
      setMessage("Image deleted.");
    } else {
      setMessage("Delete failed.");
    }
  };

  const handleKill = async () => {
    if (!selectedProjectId) {
      setMessage("Select a project first.");
      return;
    }
    if (!confirm("Mark project as complete? This will publish it to the portfolio.")) return;

    setUploading(true);
    const res = await adminFetch("/api/admin/projects", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: selectedProjectId, status: "killed" }),
    });

    if (!res.ok) {
      setMessage("Error completing project.");
      setUploading(false);
      return;
    }

    if (selectedWorkerId) {
      try {
        await adminFetch("/api/admin/notify-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            client_id: selectedWorkerId,
            message: `Project "${selectedProject?.work_description || ""}" has been marked as completed.`,
            target_url: selectedProject?.token_string
              ? `/workspace/${selectedProject.token_string}`
              : null,
          }),
        });
      } catch {}
    }

    // Fetch preview images for auto-post modal
    const previewImages = (progressData || [])
      .slice(0, 6)
      .map((p) => p.image_url);

    const title = selectedProject?.work_description || "Our latest project";
    const city = selectedProject?.city ? ` in ${selectedProject.city}` : "";
    setAutoPostData({
      type: "project",
      sourceId: selectedProjectId,
      defaultContent: `Just completed: ${title}${city} 🛠️\n\nSee the full story in our portfolio.`,
      previewImages,
    });
    setAutoPostOpen(true);

    setMessage("Project completed and published to portfolio.");
    setUploading(false);
    await loadProjects();
    setSelectedProjectId("");
    setSelectedProject(null);
    setSelectedWorkerId("");
    setProgressData([]);
    setTimeline([]);
  };

  // ----- Timeline helpers -----

  const addMilestone = () => {
    setTimeline([
      ...timeline,
      {
        id: `m_${Date.now()}`,
        name: "New milestone",
        status: "pending",
        date: new Date().toISOString().slice(0, 10),
        note: "",
      },
    ]);
    setTimelineDirty(true);
  };

  const updateMilestone = (idx, field, value) => {
    const next = [...timeline];
    next[idx] = { ...next[idx], [field]: value };
    setTimeline(next);
    setTimelineDirty(true);
  };

  const removeMilestone = (idx) => {
    const next = [...timeline];
    next.splice(idx, 1);
    setTimeline(next);
    setTimelineDirty(true);
  };

  const moveMilestone = (idx, dir) => {
    const next = [...timeline];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setTimeline(next);
    setTimelineDirty(true);
  };

  const saveTimeline = async () => {
    if (!selectedProjectId) return;
    setTimelineSaving(true);
    const res = await adminFetch("/api/admin/projects", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: selectedProjectId, timeline }),
    });
    setTimelineSaving(false);
    if (res.ok) {
      setTimelineDirty(false);
      setMessage("Timeline saved.");
    } else {
      setMessage("Failed to save timeline.");
    }
  };

  const selectedLabel = selectedProject
    ? `${selectedProject.work_description || "Untitled"} ${
        selectedProject.token_string ? `(#${selectedProject.token_string})` : "(Standalone)"
      }`
    : "";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
        Upload Progress & Manage Projects
      </h1>

      <div className="bg-white dark:bg-gray-900 p-5 md:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
          Select Project
        </h2>
        <select
          value={selectedProjectId}
          onChange={handleProjectChange}
          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-amber-500"
        >
          <option value="">-- Choose an active project --</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.work_description || "Untitled"}{" "}
              {p.token_string ? `(#${p.token_string})` : "(Standalone)"}
              {p.client_name ? ` – ${p.client_name}` : ""}
            </option>
          ))}
        </select>
      </div>

      {selectedProjectId && (
        <>
          {/* Timeline editor */}
          <div className="bg-white dark:bg-gray-900 p-5 md:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                Project Timeline
              </h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={addMilestone}
                  className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-3 py-2 rounded-lg text-sm font-medium"
                >
                  <PlusIcon /> Add Milestone
                </button>
                {timelineDirty && (
                  <button
                    type="button"
                    onClick={saveTimeline}
                    disabled={timelineSaving}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                  >
                    {timelineSaving ? "Saving..." : "Save Timeline"}
                  </button>
                )}
              </div>
            </div>

            {timeline.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No milestones yet. Add the first one to give clients a clear picture of progress.
              </p>
            ) : (
              <div className="space-y-3">
                {timeline.map((m, idx) => (
                  <div
                    key={m.id || idx}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 flex flex-col md:flex-row gap-3 items-start"
                  >
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => moveMilestone(idx, -1)}
                        disabled={idx === 0}
                        className="text-xs text-gray-500 hover:text-amber-600 disabled:opacity-30"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={() => moveMilestone(idx, 1)}
                        disabled={idx === timeline.length - 1}
                        className="text-xs text-gray-500 hover:text-amber-600 disabled:opacity-30"
                      >
                        ▼
                      </button>
                    </div>
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2 w-full">
                      <input
                        type="text"
                        value={m.name || ""}
                        onChange={(e) => updateMilestone(idx, "name", e.target.value)}
                        placeholder="Milestone name"
                        className="md:col-span-2 border border-gray-300 dark:border-gray-600 rounded p-2 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                      />
                      <select
                        value={m.status || "pending"}
                        onChange={(e) => updateMilestone(idx, "status", e.target.value)}
                        className="border border-gray-300 dark:border-gray-600 rounded p-2 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      <input
                        type="date"
                        value={m.date || ""}
                        onChange={(e) => updateMilestone(idx, "date", e.target.value)}
                        className="border border-gray-300 dark:border-gray-600 rounded p-2 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                      />
                      <input
                        type="text"
                        value={m.note || ""}
                        onChange={(e) => updateMilestone(idx, "note", e.target.value)}
                        placeholder="Optional note"
                        className="md:col-span-2 border border-gray-300 dark:border-gray-600 rounded p-2 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeMilestone(idx)}
                      className="text-red-500 hover:text-red-700 p-2"
                      aria-label="Remove"
                    >
                      <CloseIcon />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upload progress */}
          <div className="bg-white dark:bg-gray-900 p-5 md:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
              Upload Progress Images
            </h2>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block font-medium mb-1 text-sm text-gray-700 dark:text-gray-300">
                  Overall note (optional)
                </label>
                <textarea
                  value={overallDescription}
                  onChange={(e) => setOverallDescription(e.target.value)}
                  rows="2"
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                  placeholder="Batch note for this upload..."
                />
              </div>
              <div>
                <label className="block font-medium mb-1 text-sm text-gray-700 dark:text-gray-300">
                  Images (up to 6)
                </label>
                <input
                  id="progressImages"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                />
                {imageData.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                    {imageData.map((item, idx) => (
                      <div
                        key={idx}
                        className="relative border border-gray-200 dark:border-gray-700 rounded-lg p-2 bg-gray-50 dark:bg-gray-800"
                      >
                        <img
                          src={URL.createObjectURL(item.file)}
                          className="w-full h-24 object-cover rounded"
                          alt=""
                        />
                        <input
                          type="text"
                          placeholder="Image description"
                          value={item.description}
                          onChange={(e) => handleDescriptionChange(idx, e.target.value)}
                          className="w-full mt-1 p-1 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center"
                        >
                          <CloseIcon className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-3 flex-wrap">
                <button
                  type="submit"
                  disabled={uploading}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-lg font-medium disabled:opacity-50"
                >
                  {uploading ? "Uploading..." : "Upload Progress"}
                </button>
                <button
                  type="button"
                  onClick={handleKill}
                  disabled={uploading}
                  className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-lg font-medium disabled:opacity-50"
                >
                  Mark Complete & Publish
                </button>
              </div>
              {message && (
                <p
                  className={`text-sm ${
                    message.startsWith("Error") ? "text-red-500" : "text-green-600 dark:text-green-400"
                  }`}
                >
                  {message}
                </p>
              )}
            </form>
          </div>

          {/* Existing progress images */}
          {progressData.length > 0 && (
            <div className="bg-white dark:bg-gray-900 p-5 md:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                Uploaded Progress ({progressData.length})
              </h2>
              <div className="space-y-5">
                {progressData.map((item) => (
                  <div
                    key={item.id}
                    className="border-b border-gray-100 dark:border-gray-800 pb-4 last:border-0"
                  >
                    <div className="flex flex-wrap justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {item.uploaded_by ? "👤 Client" : "🛠️ Admin"}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(item.created_at || item.uploaded_at).toLocaleString()}
                        </p>
                        {item.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                            <strong>Image:</strong> {item.description}
                          </p>
                        )}
                        {item.explanation && (
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            <strong>Note:</strong> {item.explanation}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingId(item.id);
                            setEditExplanation(item.explanation || "");
                          }}
                          className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                        >
                          Edit note
                        </button>
                        <button
                          onClick={() => handleDeleteImage(item.id)}
                          className="text-red-600 dark:text-red-400 hover:underline text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <img
                      src={item.image_url}
                      className="w-full max-h-60 object-cover rounded-lg mt-2"
                      alt=""
                    />
                    {editingId === item.id && (
                      <div className="mt-2 flex gap-2">
                        <textarea
                          value={editExplanation}
                          onChange={(e) => setEditExplanation(e.target.value)}
                          rows="2"
                          className="flex-1 border border-gray-300 dark:border-gray-600 rounded p-2 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                        />
                        <button
                          onClick={() => handleEditExplanation(item.id)}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="bg-gray-300 dark:bg-gray-700 px-3 py-1 rounded text-sm text-gray-800 dark:text-gray-200"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <AutoPostModal
        open={autoPostOpen}
        onClose={() => setAutoPostOpen(false)}
        type={autoPostData.type}
        sourceId={autoPostData.sourceId}
        defaultContent={autoPostData.defaultContent}
        previewImages={autoPostData.previewImages}
      />
    </div>
  );
}
