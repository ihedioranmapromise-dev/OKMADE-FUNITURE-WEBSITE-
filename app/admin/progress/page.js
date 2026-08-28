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
  const [description, setDescription] = useState("");
  const [explanation, setExplanation] = useState("");
  const [images, setImages] = useState([]);
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
      setUnreadCount(data.filter(n => !n.is_read).length);
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
    setImages(Array.from(e.target.files));
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedTokenId || images.length === 0) {
      setMessage("Select a token and at least one image.");
      return;
    }
    setUploading(true);
    setMessage("");
    try {
      for (let i = 0; i < images.length; i++) {
        const file = images[i];
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
          description: description || "Admin update",
          explanation: explanation || "",
          uploaded_by: null, // null means admin
        });
      }
      setMessage(`Uploaded ${images.length} admin progress image(s).`);
      setImages([]);
      setDescription("");
      setExplanation("");
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
      // Refresh
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
      // Remove from storage
      const path = imageUrl.split("/public/")[1];
      if (path) {
        await supabase.storage.from("workspace-progress").remove([path]);
      }
      // Remove from database
      await supabase.from("progress_images").delete().eq("id", imageId);
      // Refresh
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
      // Notification
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
          <button onClick={markNotificationsRead} className="bg-amber-100 p-2 rounded-full hover:bg-amber-200 transition">
            🔔 {unreadCount > 0 && <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{unreadCount}</span>}
          </button>
        </div>
      </div>
      <div className="bg-white p-6 rounded-xl shadow-md mb-8">
        <h2 className="text-lg font-semibold mb-4">Upload Progress</h2>
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block font-medium mb-1">Select Active Token</label>
            <select value={selectedTokenId} onChange={handleTokenChange} className="w-full border p-2 rounded" required>
              <option value="">-- Choose a token --</option>
              {tokens.map((t) => <option key={t.id} value={t.id}>{t.token_string} - {t.client_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block font-medium mb-1">Short Description</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border p-2 rounded" />
          </div>
          <div>
            <label className="block font-medium mb-1">Detailed Explanation (optional)</label>
            <textarea value={explanation} onChange={(e) => setExplanation(e.target.value)} rows="3" className="w-full border p-2 rounded" />
          </div>
          <div>
            <label className="block font-medium mb-1">Images (multiple allowed)</label>
            <input id="progressImages" type="file" accept="image/*" multiple onChange={handleImageChange} className="w-full border p-2 rounded" />
            <p className="text-sm text-gray-500 mt-1">{images.length} file(s) selected</p>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={uploading} className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50">{uploading ? "Uploading..." : "Upload Progress"}</button>
            <button type="button" onClick={handleKill} disabled={uploading || !selectedTokenId} className="bg-red-600 text-white px-4 py-2 rounded disabled:opacity-50">Kill Token</button>
          </div>
          {message && <p className={`mt-2 ${message.startsWith("Error") ? "text-red-500" : "text-green-500"}`}>{message}</p>}
        </form>
      </div>

      {/* List of uploaded progress with edit/delete */}
      {progressData.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-lg font-semibold mb-4">Uploaded Progress</h2>
          <div className="space-y-6">
            {progressData.map((item) => {
              const isClient = item.uploaded_by !== null;
              const uploaderName = isClient ? (item.clients?.display_name || item.clients?.username || "Client") : "Admin";
              return (
                <div key={item.id} className="border-b pb-4 last:border-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-700">{isClient ? "👤 Client" : "🛠️ Admin"} – {uploaderName}</p>
                      <p className="text-sm text-gray-500">{new Date(item.created_at).toLocaleString()}</p>
                      {item.description && <p className="text-sm text-gray-600"><strong>Description:</strong> {item.description}</p>}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingId(item.id); setEditExplanation(item.explanation || ""); }} className="text-blue-600 hover:underline text-sm">Edit Explanation</button>
                      <button onClick={() => handleDeleteImage(item.id, item.image_url)} className="text-red-600 hover:underline text-sm">Delete Image</button>
                    </div>
                  </div>
                  <img src={getOptimizedImage(item.image_url, 400)} className="w-full max-h-60 object-cover rounded-lg mt-2" />
                  {editingId === item.id && (
                    <div className="mt-2 flex gap-2">
                      <textarea value={editExplanation} onChange={(e) => setEditExplanation(e.target.value)} rows="2" className="flex-1 border p-2 rounded" />
                      <button onClick={() => handleEditExplanation(item.id)} className="bg-green-600 text-white px-3 py-1 rounded">Save</button>
                      <button onClick={() => setEditingId(null)} className="bg-gray-300 px-3 py-1 rounded">Cancel</button>
                    </div>
                  )}
                  {item.explanation && editingId !== item.id && (
                    <div className="mt-2 p-3 bg-gray-50 rounded">
                      <p className="text-gray-700 whitespace-pre-wrap">{item.explanation}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Notification center (simple list) */}
      <div className="mt-8 bg-white p-6 rounded-xl shadow-md">
        <h2 className="text-lg font-semibold mb-4">Recent Notifications</h2>
        {notifications.length === 0 ? (
          <p className="text-gray-500">No notifications.</p>
        ) : (
          <ul className="space-y-2">
            {notifications.map((n) => (
              <li key={n.id} className={`p-2 rounded ${n.is_read ? 'bg-gray-50' : 'bg-amber-50'}`}>
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
