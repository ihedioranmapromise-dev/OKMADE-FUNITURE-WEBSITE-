"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function AdminProgress() {
  const [tokens, setTokens] = useState([]);
  const [selectedTokenId, setSelectedTokenId] = useState("");
  const [selectedTokenString, setSelectedTokenString] = useState("");
  const [overallDescription, setOverallDescription] = useState("");
  const [imageData, setImageData] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [progressData, setProgressData] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editExplanation, setEditExplanation] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();

  if (typeof window !== "undefined" && sessionStorage.getItem("adminAuth") !== "true") {
    router.push("/admin/login");
    return null;
  }

  useEffect(() => {
    fetchTokens();
    fetchNotifications();
  }, []);

  async function fetchTokens() {
    const { data, error } = await supabase
      .from("tokens")
      .select("id, token_string, client_name")
      .eq("status", "active")
      .order("created_at", { ascending: false });
    if (!error) setTokens(data || []);
  }

  async function fetchNotifications() {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.is_read).length);
    }
  }

  const handleTokenChange = async (e) => {
    const id = e.target.value;
    const token = tokens.find((t) => t.id === id);
    setSelectedTokenId(id);
    setSelectedTokenString(token ? token.token_string : "");
    if (id) {
      const { data } = await supabase
        .from("progress_images")
        .select("*, clients(display_name, username)")
        .eq("token_id", id)
        .order("created_at", { ascending: false });
      setProgressData(data || []);
    } else {
      setProgressData([]);
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (imageData.length + files.length > 6) {
      setMessage("You can upload up to 6 progress images total.");
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

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedTokenId || imageData.length === 0) {
      setMessage("Select a token and at least one image.");
      return;
    }
    setUploading(true);
    setMessage("");
    try {
      for (let i = 0; i < imageData.length; i++) {
        const { file, description: imgDesc } = imageData[i];
        const ext = file.name.split(".").pop();
        const fileName = `progress/${selectedTokenString}_${Date.now()}_${i}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("workspace-progress")
          .upload(fileName, file);
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("workspace-progress")
          .getPublicUrl(fileName);

        await supabase.from("progress_images").insert({
          token_id: selectedTokenId,
          image_url: urlData.publicUrl,
          description: imgDesc || null,
          explanation: overallDescription || null,
          uploaded_by: null, // null means admin
        });
      }

      // Create notification
      await supabase.from("notifications").insert({
        token_id: selectedTokenId,
        type: "client_upload",
        message: `Admin uploaded ${imageData.length} progress image(s) on token ${selectedTokenString}`,
      });

      setMessage(`Uploaded ${imageData.length} progress image(s).`);
      setImageData([]);
      setOverallDescription("");
      document.getElementById("progressImages").value = "";

      // Refresh progress list
      const { data } = await supabase
        .from("progress_images")
        .select("*, clients(display_name, username)")
        .eq("token_id", selectedTokenId)
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
    try {
      const { error } = await supabase
        .from("progress_images")
        .update({ explanation: editExplanation })
        .eq("id", id);
      if (error) throw error;
      setEditingId(null);
      setEditExplanation("");
      const { data } = await supabase
        .from("progress_images")
        .select("*, clients(display_name, username)")
        .eq("token_id", selectedTokenId)
        .order("created_at", { ascending: false });
      setProgressData(data || []);
      setMessage("Explanation updated.");
    } catch (err) {
      setMessage("Error updating explanation: " + err.message);
    }
  };

  const handleDeleteImage = async (imageId, imageUrl) => {
    if (!confirm("Delete this image? This cannot be undone.")) return;
    try {
      const path = imageUrl.split("/public/")[1];
      if (path) {
        await supabase.storage.from("workspace-progress").remove([path]);
      }
      await supabase.from("progress_images").delete().eq("id", imageId);
      const { data } = await supabase
        .from("progress_images")
        .select("*, clients(display_name, username)")
        .eq("token_id", selectedTokenId)
        .order("created_at", { ascending: false });
      setProgressData(data || []);
      setMessage("Image deleted.");
    } catch (err) {
      setMessage("Error deleting image: " + err.message);
    }
  };

  const handleKill = async () => {
    if (!selectedTokenId) {
      setMessage("Select a token first.");
      return;
    }
    if (!confirm(`Kill token ${selectedTokenString}?`)) return;
    setUploading(true);
    const { error } = await supabase
      .from("tokens")
      .update({ status: "killed" })
      .eq("id", selectedTokenId);
    if (error) {
      setMessage("Error killing token: " + error.message);
    } else {
      await supabase.from("notifications").insert({
        token_id: selectedTokenId,
        type: "token_killed",
        message: `Token ${selectedTokenString} was killed.`,
      });
      setMessage(`Token ${selectedTokenString} killed.`);
      fetchTokens();
      setSelectedTokenId("");
      setSelectedTokenString("");
      setProgressData([]);
    }
    setUploading(false);
  };

  const markNotificationsRead = async () => {
    await supabase.from("notifications").update({ is_read: true }).neq("is_read", true);
    setUnreadCount(0);
    fetchNotifications();
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Upload Progress & Manage Tokens</h1>
        <div className="relative">
          <button
            onClick={markNotificationsRead}
            className="bg-amber-100 p-2 rounded-full hover:bg-amber-200 transition"
          >
            🔔{" "}
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-md mb-8">
        <h2 className="text-lg font-semibold mb-4">Upload Progress</h2>
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block font-medium mb-1">Select Active Token</label>
            <select
              value={selectedTokenId}
              onChange={handleTokenChange}
              className="w-full border p-2 rounded"
              required
            >
              <option value="">-- Choose a token --</option>
              {tokens.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.token_string} - {t.client_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-medium mb-1">Overall Description / Complaints (optional)</label>
            <textarea
              value={overallDescription}
              onChange={(e) => setOverallDescription(e.target.value)}
              rows="3"
              className="w-full border p-2 rounded"
              placeholder="Write any general notes, complaints, or overall update about this progress..."
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Progress Images (up to 6)</label>
            <input
              id="progressImages"
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
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={uploading}
              className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "Upload Progress"}
            </button>
            <button
              type="button"
              onClick={handleKill}
              disabled={uploading || !selectedTokenId}
              className="bg-red-600 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              Kill Token
            </button>
          </div>
          {message && (
            <p className={`mt-2 ${message.startsWith("Error") ? "text-red-500" : "text-green-500"}`}>
              {message}
            </p>
          )}
        </form>
      </div>

      {progressData.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-lg font-semibold mb-4">Uploaded Progress</h2>
          <div className="space-y-6">
            {progressData.map((item) => {
              const isClient = item.uploaded_by !== null;
              const uploaderName = isClient
                ? item.clients?.display_name || item.clients?.username || "Client"
                : "Admin";
              return (
                <div key={item.id} className="border-b pb-4 last:border-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        {isClient ? "👤 Client" : "🛠️ Admin"} – {uploaderName}
                      </p>
                      <p className="text-sm text-gray-500">{new Date(item.created_at).toLocaleString()}</p>
                      {item.description && (
                        <p className="text-sm text-gray-600">
                          <strong>Image desc:</strong> {item.description}
                        </p>
                      )}
                      {item.explanation && (
                        <p className="text-sm text-gray-600">
                          <strong>Overall note:</strong> {item.explanation}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingId(item.id);
                          setEditExplanation(item.explanation || "");
                        }}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        Edit Note
                      </button>
                      <button
                        onClick={() => handleDeleteImage(item.id, item.image_url)}
                        className="text-red-600 hover:underline text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <img
                    src={item.image_url}
                    className="w-full max-h-60 object-cover rounded-lg mt-2"
                  />
                  {editingId === item.id && (
                    <div className="mt-2 flex gap-2">
                      <textarea
                        value={editExplanation}
                        onChange={(e) => setEditExplanation(e.target.value)}
                        rows="2"
                        className="flex-1 border p-2 rounded"
                      />
                      <button
                        onClick={() => handleEditExplanation(item.id)}
                        className="bg-green-600 text-white px-3 py-1 rounded"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="bg-gray-300 px-3 py-1 rounded"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-8 bg-white p-6 rounded-xl shadow-md">
        <h2 className="text-lg font-semibold mb-4">Recent Notifications</h2>
        {notifications.length === 0 ? (
          <p className="text-gray-500">No notifications.</p>
        ) : (
          <ul className="space-y-2">
            {notifications.map((n) => (
              <li key={n.id} className={`p-2 rounded ${n.is_read ? "bg-gray-50" : "bg-amber-50"}`}>
                <p className="text-sm">{n.message}</p>
                <p className="text-xs text-gray-400">{new Date(n.created_at).toLocaleString()}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}