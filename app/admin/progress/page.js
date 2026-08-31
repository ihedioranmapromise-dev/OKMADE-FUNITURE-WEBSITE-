"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// SVG Icons
const BellIcon = ({ unread }) => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    {unread > 0 && <circle cx="20" cy="4" r="3" fill="#ef4444" stroke="#fff" strokeWidth="2" />}
  </svg>
);

const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export default function AdminProgress() {
  const [tokens, setTokens] = useState([]);
  const [selectedTokenId, setSelectedTokenId] = useState("");
  const [selectedTokenString, setSelectedTokenString] = useState("");
  const [selectedWorkerId, setSelectedWorkerId] = useState("");
  const [overallDescription, setOverallDescription] = useState("");
  const [imageData, setImageData] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [progressData, setProgressData] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editExplanation, setEditExplanation] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
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
      .select("id, token_string, client_name, client_id")
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
    setSelectedWorkerId(token ? token.client_id : "");
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

      // Create notification for the artisan (if linked)
      if (selectedWorkerId) {
        await supabase.from("notifications").insert({
          client_id: selectedWorkerId,
          type: "progress_uploaded",
          message: `New progress update on token "${selectedTokenString}".`,
          target_url: `/workspace/${selectedTokenString}`,
        });
      }

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
      fetchNotifications(); // refresh unread count
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
      // Notify artisan if linked
      if (selectedWorkerId) {
        await supabase.from("notifications").insert({
          client_id: selectedWorkerId,
          type: "token_killed",
          message: `Token "${selectedTokenString}" has been marked as completed.`,
          target_url: `/workspace/${selectedTokenString}`,
        });
      }
      setMessage(`Token ${selectedTokenString} killed.`);
      fetchTokens();
      setSelectedTokenId("");
      setSelectedTokenString("");
      setProgressData([]);
    }
    setUploading(false);
  };

  const markAsRead = async (id) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleNotificationClick = (notif) => {
    markAsRead(notif.id);
    if (notif.target_url) router.push(notif.target_url);
    setShowNotifications(false);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Upload Progress & Manage Tokens</h1>
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 hover:bg-gray-100 rounded-full transition"
          >
            <BellIcon unread={unreadCount} />
          </button>
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-10 max-h-96 overflow-y-auto">
              <div className="p-3 border-b font-semibold">Notifications</div>
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">No notifications.</div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`p-3 border-b hover:bg-gray-50 cursor-pointer transition ${!n.is_read ? 'bg-amber-50' : ''}`}
                  >
                    <p className="text-sm">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                  </div>
                ))
              )}
            </div>
          )}
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
            <label className="block font-medium mb-1">Overall Description / Notes</label>
            <textarea
              value={overallDescription}
              onChange={(e) => setOverallDescription(e.target.value)}
              rows="3"
              className="w-full border p-2 rounded"
              placeholder="Write any general notes about this progress..."
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
                      <CloseIcon />
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
    </div>
  );
}