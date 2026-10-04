"use client";
import { useState, useEffect } from "react";
import { adminFetch } from "@/lib/admin-client";
import AutoPostModal from "@/app/components/AutoPostModal";
import { CloseIcon } from "@/lib/icons";

export default function GenerateProjectTab() {
  const [workers, setWorkers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientContact, setClientContact] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [workDescription, setWorkDescription] = useState("");
  const [city, setCity] = useState("");
  const [durationWeeks, setDurationWeeks] = useState("");
  const [projectDetails, setProjectDetails] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [price, setPrice] = useState("");
  const [imageData, setImageData] = useState([]);
  const [generatedToken, setGeneratedToken] = useState("");
  const [isStandalone, setIsStandalone] = useState(false);
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
    loadWorkers();
    loadCategories();
  }, []);

  async function loadWorkers() {
    try {
      const res = await fetch("/api/admin/workers", {
        headers: { "x-admin-key": key() },
      });
      if (res.ok) setWorkers((await res.json()) || []);
    } catch {}
  }

  async function loadCategories() {
    try {
      const res = await fetch("/api/admin/categories", {
        headers: { "x-admin-key": key() },
      });
      if (res.ok) setCategories((await res.json()) || []);
    } catch {}
  }

  const handleWorkerChange = (e) => {
    const id = e.target.value;
    setSelectedWorkerId(id);
    if (id === "manual") {
      setClientName("");
      setClientContact("");
      setClientAddress("");
      return;
    }
    const worker = workers.find((w) => w.id === id);
    if (worker) {
      const name =
        worker.display_name ||
        `${worker.first_name || ""} ${worker.last_name || ""}`.trim();
      setClientName(name || "");
      setClientContact(worker.phone_number || "");
      setClientAddress(worker.work_address || "");
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (imageData.length + files.length > 6) {
      setMessage("Max 6 images.");
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!workDescription || imageData.length === 0) {
      setMessage("Enter a work description and select at least one image.");
      return;
    }
    if (!isStandalone && (!clientName || !clientContact)) {
      setMessage("Client name and contact required for client projects.");
      return;
    }

    setUploading(true);
    setMessage("");
    try {
      // Upload images first
      const { createClient } = await import("@supabase/supabase-js");
      const sb = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );

      const uploadedImages = [];
      for (let i = 0; i < imageData.length; i++) {
        const { file, description } = imageData[i];
        const ext = file.name.split(".").pop();
        const folder = isStandalone ? "standalone" : "requests";
        const fileName = `${folder}_${Date.now()}_${i}.${ext}`;
        const { error: upErr } = await sb.storage
          .from("workspace-requests")
          .upload(fileName, file, { cacheControl: "31536000" });
        if (upErr) throw upErr;
        const { data: urlData } = sb.storage
          .from("workspace-requests")
          .getPublicUrl(fileName);
        uploadedImages.push({
          url: urlData.publicUrl,
          description: description || null,
        });
      }

      const res = await adminFetch("/api/admin/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_standalone: isStandalone,
          client_name: clientName,
          client_contact: clientContact,
          client_address: clientAddress,
          work_description: workDescription,
          city,
          duration_weeks: durationWeeks,
          project_details: projectDetails,
          category_id: categoryId,
          price,
          client_id:
            !isStandalone && selectedWorkerId && selectedWorkerId !== "manual"
              ? selectedWorkerId
              : null,
          images: uploadedImages,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");

      if (isStandalone) {
        setMessage(`Standalone project created.`);
        setGeneratedToken("");
      } else {
        setGeneratedToken(data.token_string);
        setMessage(`Project created. Token: ${data.token_string}`);
      }

      // Open auto-post modal
      const cityPart = city ? ` in ${city}` : "";
      setAutoPostData({
        type: "project",
        sourceId: data.id,
        defaultContent: `🛠️ New project started: ${workDescription}${cityPart}`,
        previewImages: uploadedImages.slice(0, 6).map((i) => i.url),
      });
      setAutoPostOpen(true);

      // Reset
      setClientName("");
      setClientContact("");
      setClientAddress("");
      setWorkDescription("");
      setCity("");
      setDurationWeeks("");
      setProjectDetails("");
      setCategoryId("");
      setPrice("");
      setImageData([]);
      setSelectedWorkerId("");
      const el = document.getElementById("requestImages");
      if (el) el.value = "";
    } catch (err) {
      setMessage("Error: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("Link copied!");
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">
        Generate Project
      </h1>

      <div className="mb-6 bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isStandalone}
            onChange={(e) => setIsStandalone(e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
            Standalone Project (no client, no token)
          </span>
        </label>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {isStandalone
            ? "Portfolio only — no client workspace."
            : "Generates a client token for tracking progress."}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 space-y-4"
      >
        {!isStandalone && (
          <div>
            <label className="block font-medium mb-1 text-sm text-gray-700 dark:text-gray-300">
              Assign to Worker
            </label>
            <select
              value={selectedWorkerId}
              onChange={handleWorkerChange}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
            >
              <option value="">-- Select or skip --</option>
              <option value="manual">Enter manually (skip)</option>
              {workers.map((w) => {
                const name =
                  w.display_name ||
                  `${w.first_name || ""} ${w.last_name || ""}`.trim();
                return (
                  <option key={w.id} value={w.id}>
                    {name || w.id.slice(0, 8)}{" "}
                    {w.phone_number ? `(${w.phone_number})` : ""}
                  </option>
                );
              })}
            </select>
          </div>
        )}

        {!isStandalone && (
          <>
            <div>
              <label className="block font-medium mb-1 text-sm text-gray-700 dark:text-gray-300">
                Client Name *
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block font-medium mb-1 text-sm text-gray-700 dark:text-gray-300">
                Client Contact (WhatsApp) *
              </label>
              <input
                type="text"
                value={clientContact}
                onChange={(e) => setClientContact(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block font-medium mb-1 text-sm text-gray-700 dark:text-gray-300">
                Client Address
              </label>
              <textarea
                value={clientAddress}
                onChange={(e) => setClientAddress(e.target.value)}
                rows="2"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
              />
            </div>
          </>
        )}

        <div>
          <label className="block font-medium mb-1 text-sm text-gray-700 dark:text-gray-300">
            Work Description (Title) *
          </label>
          <textarea
            value={workDescription}
            onChange={(e) => setWorkDescription(e.target.value)}
            rows="2"
            placeholder="e.g., Luxury Hotel Suite Renovation"
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-medium mb-1 text-sm text-gray-700 dark:text-gray-300">
              City
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="block font-medium mb-1 text-sm text-gray-700 dark:text-gray-300">
              Duration (weeks)
            </label>
            <input
              type="number"
              value={durationWeeks}
              onChange={(e) => setDurationWeeks(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
            />
          </div>
        </div>

        <div>
          <label className="block font-medium mb-1 text-sm text-gray-700 dark:text-gray-300">
            Category
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
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
          <label className="block font-medium mb-1 text-sm text-gray-700 dark:text-gray-300">
            Project Details
          </label>
          <textarea
            value={projectDetails}
            onChange={(e) => setProjectDetails(e.target.value)}
            rows="5"
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
          />
        </div>

        <div>
          <label className="block font-medium mb-1 text-sm text-gray-700 dark:text-gray-300">
            Price (₦) — optional
          </label>
          <input
            type="number"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
          />
        </div>

        <div>
          <label className="block font-medium mb-1 text-sm text-gray-700 dark:text-gray-300">
            Request Images (up to 6) *
          </label>
          <input
            id="requestImages"
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
          />
          {imageData.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
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
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => handleDescriptionChange(idx, e.target.value)}
                    className="w-full mt-1 p-1 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center"
                  >
                    <CloseIcon className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={uploading}
          className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-lg font-medium disabled:opacity-50"
        >
          {uploading ? "Creating..." : isStandalone ? "Create Project" : "Generate Token"}
        </button>

        {message && (
          <p className={`text-sm ${message.startsWith("Error") ? "text-red-500" : "text-green-600 dark:text-green-400"}`}>
            {message}
          </p>
        )}

        {generatedToken && (
          <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <p className="font-bold text-gray-800 dark:text-gray-100">
              Token: <span className="font-mono">{generatedToken}</span>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Workspace URL:</p>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="text"
                readOnly
                value={`${process.env.NEXT_PUBLIC_BASE_URL}/workspace/${generatedToken}`}
                className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100"
              />
              <button
                type="button"
                onClick={() =>
                  copyToClipboard(
                    `${process.env.NEXT_PUBLIC_BASE_URL}/workspace/${generatedToken}`
                  )
                }
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm"
              >
                Copy
              </button>
            </div>
          </div>
        )}
      </form>

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
