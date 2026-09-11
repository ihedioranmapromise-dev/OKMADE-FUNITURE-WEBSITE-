"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function AdminProjects() {
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
  const [isStandalone, setIsStandalone] = useState(false); // toggle: client project or standalone
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  if (typeof window !== "undefined" && sessionStorage.getItem("adminAuth") !== "true") {
    router.push("/admin/login");
    return null;
  }

  useEffect(() => {
    fetchWorkers();
    fetchCategories();
  }, []);

  async function fetchWorkers() {
    const { data, error } = await supabase
      .from("clients")
      .select("id, display_name, first_name, last_name, phone_number, work_address")
      .order("display_name", { ascending: true });
    if (!error) setWorkers(data || []);
  }

  async function fetchCategories() {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name", { ascending: true });
    if (!error) setCategories(data || []);
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
      const name = worker.display_name || `${worker.first_name || ""} ${worker.last_name || ""}`.trim();
      setClientName(name || "");
      setClientContact(worker.phone_number || "");
      setClientAddress(worker.work_address || "");
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (imageData.length + files.length > 6) {
      setMessage("You can upload up to 6 request images total.");
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

  const generateTokenString = () => {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!workDescription || imageData.length === 0) {
      setMessage("Please enter a work description and select at least one image.");
      return;
    }
    if (!isStandalone && (!clientName || !clientContact)) {
      setMessage("Client name and contact are required for client projects.");
      return;
    }

    setUploading(true);
    setMessage("");

    try {
      // Only generate a token string if it's a client project
      const tokenString = isStandalone ? null : generateTokenString();

      const { data: project, error: projectError } = await supabase
        .from("projects")
        .insert([
          {
            token_string: tokenString,
            client_name: isStandalone ? null : clientName,
            client_contact: isStandalone ? null : clientContact,
            client_address: isStandalone ? null : clientAddress || null,
            work_description: workDescription,
            city: city || null,
            duration_weeks: durationWeeks ? parseInt(durationWeeks) : null,
            project_details: projectDetails || null,
            category_id: categoryId || null,
            price: price ? parseFloat(price) : null,
            status: "active",
            is_standalone: isStandalone,
            client_id: !isStandalone && selectedWorkerId !== "manual" && selectedWorkerId !== "" ? selectedWorkerId : null,
          },
        ])
        .select()
        .single();
      if (projectError) throw projectError;

      // Upload request images
      for (let i = 0; i < imageData.length; i++) {
        const { file, description: imgDesc } = imageData[i];
        const ext = file.name.split(".").pop();
        const folder = isStandalone ? "standalone" : `requests/${tokenString}`;
        const fileName = `${folder}_${Date.now()}_${i}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("workspace-requests")
          .upload(fileName, file);
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("workspace-requests")
          .getPublicUrl(fileName);

        await supabase.from("project_request_images").insert({
          project_id: project.id,
          image_url: urlData.publicUrl,
          display_order: i,
          description: imgDesc || null,
        });
      }

      // Send notification to the selected artisan (only for client projects)
      if (!isStandalone && selectedWorkerId !== "manual" && selectedWorkerId !== "") {
        await supabase.from("notifications").insert({
          client_id: selectedWorkerId,
          type: "project_generated",
          message: `A new project "${tokenString}" has been assigned to you.`,
          target_url: `/workspace/${tokenString}`,
        });
      }

      if (isStandalone) {
        setMessage(`Standalone project created successfully (ID: ${project.id.slice(0, 8)}).`);
        setGeneratedToken("");
      } else {
        setGeneratedToken(tokenString);
        setMessage(`Project token generated: ${tokenString}`);
      }

      // Reset form
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
      document.getElementById("requestImages").value = "";
    } catch (err) {
      setMessage("Error: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("Workspace link copied to clipboard!");
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Generate Project</h1>

      {/* Standalone toggle */}
      <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isStandalone}
            onChange={(e) => setIsStandalone(e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-sm font-medium text-gray-700">
            Standalone Project (no client, no token – just for portfolio)
          </span>
        </label>
        <p className="text-xs text-gray-500 mt-1">
          {isStandalone
            ? "This project will not generate a client token and will be shown in the portfolio only."
            : "This project will generate a token for the client to track progress."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Worker select (only for client projects) */}
        {!isStandalone && (
          <div>
            <label className="block font-medium mb-1">Select Worker (Artisan) – or skip</label>
            <select
              value={selectedWorkerId}
              onChange={handleWorkerChange}
              className="w-full border p-2 rounded"
            >
              <option value="">-- Select a worker (or skip) --</option>
              <option value="manual">✏️ Enter manually (skip)</option>
              {workers.map((w) => {
                const name = w.display_name || `${w.first_name || ""} ${w.last_name || ""}`.trim();
                return (
                  <option key={w.id} value={w.id}>
                    {name || w.id.slice(0, 8)} {w.phone_number ? `(${w.phone_number})` : ""}
                  </option>
                );
              })}
            </select>
          </div>
        )}

        {/* Client fields (hidden for standalone) */}
        {!isStandalone && (
          <>
            <div>
              <label className="block font-medium mb-1">Client Name *</label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full border p-2 rounded"
                required
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Client Contact (WhatsApp) *</label>
              <input
                type="text"
                value={clientContact}
                onChange={(e) => setClientContact(e.target.value)}
                className="w-full border p-2 rounded"
                required
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Client Address</label>
              <textarea
                value={clientAddress}
                onChange={(e) => setClientAddress(e.target.value)}
                className="w-full border p-2 rounded"
                rows="2"
              />
            </div>
          </>
        )}

        {/* Project fields (always visible) */}
        <div>
          <label className="block font-medium mb-1">Work Description (Project Title) *</label>
          <textarea
            value={workDescription}
            onChange={(e) => setWorkDescription(e.target.value)}
            className="w-full border p-2 rounded"
            rows="2"
            placeholder="e.g., Luxury Hotel Suite Renovation"
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
              placeholder="e.g., Lagos"
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Duration (weeks)</label>
            <input
              type="number"
              value={durationWeeks}
              onChange={(e) => setDurationWeeks(e.target.value)}
              className="w-full border p-2 rounded"
              placeholder="e.g., 4"
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
          <label className="block font-medium mb-1">Project Details (full story)</label>
          <textarea
            value={projectDetails}
            onChange={(e) => setProjectDetails(e.target.value)}
            className="w-full border p-2 rounded"
            rows="5"
            placeholder="Describe the scope, challenges, materials used, and the final outcome..."
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Price (₦) (optional)</label>
          <input
            type="number"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Request / Concept Images (up to 6) *</label>
          <input
            id="requestImages"
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            className="w-full border p-2 rounded"
            required
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
          className="bg-yellow-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {uploading ? "Generating..." : isStandalone ? "Create Project" : "Generate Token"}
        </button>

        {message && (
          <p className={`mt-4 ${message.startsWith("Error") ? "text-red-500" : "text-green-600"}`}>
            {message}
          </p>
        )}

        {generatedToken && (
          <div className="mt-4 p-4 bg-gray-100 rounded">
            <p className="font-bold">
              Token: <span className="font-mono">{generatedToken}</span>
            </p>
            <p className="text-sm text-gray-600">Workspace URL:</p>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="text"
                readOnly
                value={`${process.env.NEXT_PUBLIC_BASE_URL}/workspace/${generatedToken}`}
                className="flex-1 p-2 border rounded text-sm bg-white"
              />
              <button
                onClick={() =>
                  copyToClipboard(
                    `${process.env.NEXT_PUBLIC_BASE_URL}/workspace/${generatedToken}`
                  )
                }
                className="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition"
              >
                Copy Link
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-2">Share this link with the client via WhatsApp.</p>
          </div>
        )}
      </form>
    </div>
  );
}