"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { adminFetch } from "@/lib/admin-client";

export default function EditTestimonial() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [clientName, setClientName] = useState("");
  const [clientContact, setClientContact] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [workDescription, setWorkDescription] = useState("");
  const [city, setCity] = useState("");
  const [durationWeeks, setDurationWeeks] = useState("");
  const [projectDetails, setProjectDetails] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [price, setPrice] = useState("");
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("adminAuth") !== "true") {
      router.replace("/admin/login");
      return;
    }
    load();
  }, [id]);

  async function load() {
    setLoading(true);
    const res = await adminFetch(`/api/admin/projects/single?id=${id}`);
    if (!res.ok) {
      setMessage("Project not found.");
      setLoading(false);
      return;
    }
    const data = await res.json();
    setClientName(data.client_name || "");
    setClientContact(data.client_contact || "");
    setClientAddress(data.client_address || "");
    setWorkDescription(data.work_description || "");
    setCity(data.city || "");
    setDurationWeeks(data.duration_weeks || "");
    setProjectDetails(data.project_details || "");
    setCategoryId(data.category_id || "");
    setPrice(data.price || "");
    setCategories(data.categories || []);
    setLoading(false);
  }

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    // We use the projects PUT with an extended body
    const res = await adminFetch("/api/admin/projects", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        client_name: clientName,
        client_contact: clientContact,
        client_address: clientAddress,
        work_description: workDescription,
        city,
        duration_weeks: durationWeeks ? parseInt(durationWeeks) : null,
        project_details: projectDetails,
        category_id: categoryId || null,
        price: price ? parseFloat(price) : null,
      }),
    });
    setSaving(false);
    if (res.ok) setMessage("Saved.");
    else setMessage("Save failed — the API may need to support these fields.");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          <div className="h-64 bg-gray-100 dark:bg-gray-900 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            Edit Testimonial
          </h1>
          <a
            href="/admin/dashboard?tab=portfolio"
            className="text-sm text-amber-600 dark:text-amber-400 hover:underline"
          >
            ← Back
          </a>
        </div>

        <form onSubmit={save} className="space-y-5">
          <div className="bg-white dark:bg-gray-900 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 space-y-4">
            <div>
              <label className="block font-medium mb-1 text-sm text-gray-700 dark:text-gray-300">
                Client Name
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
                Client Contact
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
          </div>

          <div className="bg-white dark:bg-gray-900 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 space-y-4">
            <div>
              <label className="block font-medium mb-1 text-sm text-gray-700 dark:text-gray-300">
                Work Description / Title *
              </label>
              <textarea
                value={workDescription}
                onChange={(e) => setWorkDescription(e.target.value)}
                rows="2"
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
                <option value="">-- None --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
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
                Price (₦)
              </label>
              <input
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 rounded-lg disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>

          {message && (
            <p
              className={`text-sm text-center ${
                message.startsWith("Error") || message.includes("failed")
                  ? "text-red-500"
                  : "text-green-600 dark:text-green-400"
              }`}
            >
              {message}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
