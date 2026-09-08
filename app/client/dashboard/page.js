"use client";
import { useEffect, useState, useRef } from "react";
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

const CameraIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const UserIcon = () => (
  <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
  </svg>
);

// 15 fonts
const FONT_OPTIONS = [
  { label: "Sans-serif", value: "sans-serif" },
  { label: "Serif", value: "serif" },
  { label: "Cursive", value: "cursive" },
  { label: "Monospace", value: "monospace" },
  { label: "Dancing Script", value: "'Dancing Script', cursive" },
  { label: "Playfair Display", value: "'Playfair Display', serif" },
  { label: "Lobster", value: "'Lobster', cursive" },
  { label: "Montserrat", value: "'Montserrat', sans-serif" },
  { label: "Open Sans", value: "'Open Sans', sans-serif" },
  { label: "Roboto", value: "'Roboto', sans-serif" },
  { label: "Oswald", value: "'Oswald', sans-serif" },
  { label: "Raleway", value: "'Raleway', sans-serif" },
  { label: "Merriweather", value: "'Merriweather', serif" },
  { label: "Pacifico", value: "'Pacifico', cursive" },
  { label: "Cormorant Garamond", value: "'Cormorant Garamond', serif" },
];

export default function ClientDashboard() {
  const [client, setClient] = useState(null);
  const [activeTokens, setActiveTokens] = useState([]);
  const [killedTokens, setKilledTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [storyContent, setStoryContent] = useState("");
  const [storyImage, setStoryImage] = useState(null);
  const [storyImagePreview, setStoryImagePreview] = useState("");
  const [storyFont, setStoryFont] = useState("'Dancing Script', cursive");
  const [posting, setPosting] = useState(false);
  const [postMessage, setPostMessage] = useState("");
  const [myStories, setMyStories] = useState([]);
  const [editingStory, setEditingStory] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [editFont, setEditFont] = useState("");
  const [editImage, setEditImage] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState("");
  const [editImageRemoved, setEditImageRemoved] = useState(false);
  const fileInputRef = useRef(null);
  const editFileInputRef = useRef(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const clientId = sessionStorage.getItem("clientId");
    if (!clientId) {
      router.push("/client/login");
      return;
    }
    fetchClientData(clientId);
  }, []);

  async function fetchClientData(clientId) {
    setLoading(true);
    const { data: clientData, error: clientError } = await supabase
      .from("clients")
      .select("*")
      .eq("id", clientId)
      .single();
    if (clientError || !clientData) {
      router.push("/client/login");
      return;
    }
    setClient(clientData);
    // Tokens
    const { data: tokens } = await supabase
      .from("tokens")
      .select("id, token_string, status, created_at, work_description")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });
    setActiveTokens(tokens?.filter(t => t.status === "active") || []);
    setKilledTokens(tokens?.filter(t => t.status === "killed") || []);
    // My stories
    const { data: stories } = await supabase
      .from("client_posts")
      .select("*")
      .eq("client_id", clientId)
      .gt("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order("created_at", { ascending: false });
    setMyStories(stories || []);
    // Notifications
    const { data: notifs } = await supabase
      .from("notifications")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .limit(20);
    setNotifications(notifs || []);
    setUnreadCount(notifs?.filter(n => !n.is_read).length || 0);
    setLoading(false);
  }

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

  const handleStoryImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setStoryImage(file);
      setStoryImagePreview(URL.createObjectURL(file));
    }
  };

  const cancelImage = () => {
    setStoryImage(null);
    setStoryImagePreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    const hasContent = storyContent.trim().length > 0;
    const hasImage = !!storyImage;
    if (!hasContent && !hasImage) {
      setPostMessage("Please write something or upload an image.");
      return;
    }
    setPosting(true);
    setPostMessage("");
    try {
      const clientId = sessionStorage.getItem("clientId");
      let imageUrl = null;
      if (storyImage) {
        const ext = storyImage.name.split(".").pop();
        const fileName = `stories/${clientId}_${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("story-images")
          .upload(fileName, storyImage);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage
          .from("story-images")
          .getPublicUrl(fileName);
        imageUrl = urlData.publicUrl;
      }
      const { error } = await supabase.from("client_posts").insert({
        client_id: clientId,
        content: storyContent.trim() || null,
        image_url: imageUrl,
        font_family: storyFont,
      });
      if (error) throw error;
      setPostMessage("Story posted!");
      setStoryContent("");
      setStoryImage(null);
      setStoryImagePreview("");
      setStoryFont("'Dancing Script', cursive");
      if (fileInputRef.current) fileInputRef.current.value = "";
      // Refresh stories
      const { data: stories } = await supabase
        .from("client_posts")
        .select("*")
        .eq("client_id", clientId)
        .gt("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order("created_at", { ascending: false });
      setMyStories(stories || []);
    } catch (err) {
      setPostMessage("Error: " + err.message);
    } finally {
      setPosting(false);
    }
  };

  // ----- Edit/Delete Stories -----
  const startEdit = (story) => {
    setEditingStory(story.id);
    setEditContent(story.content || "");
    setEditFont(story.font_family || "'Dancing Script', cursive");
    setEditImage(null);
    setEditImagePreview(story.image_url || "");
    setEditImageRemoved(false);
  };

  const cancelEdit = () => {
    setEditingStory(null);
    setEditContent("");
    setEditFont("");
    setEditImage(null);
    setEditImagePreview("");
    setEditImageRemoved(false);
    if (editFileInputRef.current) editFileInputRef.current.value = "";
  };

  const handleEditImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditImage(file);
      setEditImagePreview(URL.createObjectURL(file));
      setEditImageRemoved(false);
    }
  };

  const removeEditImage = () => {
    setEditImage(null);
    setEditImagePreview("");
    setEditImageRemoved(true);
    if (editFileInputRef.current) editFileInputRef.current.value = "";
  };

  const saveEdit = async (storyId) => {
    const hasContent = editContent.trim().length > 0;
    const hasImage = !!editImage || (editImagePreview && !editImageRemoved);
    if (!hasContent && !hasImage) {
      alert("Story must have content or image.");
      return;
    }
    try {
      let imageUrl = null;
      if (editImage) {
        // Upload new image
        const ext = editImage.name.split(".").pop();
        const fileName = `stories/${client.id}_${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("story-images")
          .upload(fileName, editImage);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage
          .from("story-images")
          .getPublicUrl(fileName);
        imageUrl = urlData.publicUrl;
      } else if (editImageRemoved) {
        imageUrl = null;
      } else {
        // Keep existing image
        const story = myStories.find(s => s.id === storyId);
        imageUrl = story?.image_url || null;
      }
      // If image was removed, we should also delete the old image from storage
      if (editImageRemoved) {
        const story = myStories.find(s => s.id === storyId);
        if (story?.image_url) {
          const path = story.image_url.split("/public/")[1];
          if (path) {
            await supabase.storage.from("story-images").remove([path]);
          }
        }
      }
      const { error } = await supabase
        .from("client_posts")
        .update({
          content: editContent.trim() || null,
          font_family: editFont,
          image_url: imageUrl,
        })
        .eq("id", storyId);
      if (error) throw error;
      // Refresh stories
      const { data: stories } = await supabase
        .from("client_posts")
        .select("*")
        .eq("client_id", client.id)
        .gt("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order("created_at", { ascending: false });
      setMyStories(stories || []);
      cancelEdit();
    } catch (err) {
      alert("Error updating story: " + err.message);
    }
  };

  const deleteStory = async (storyId) => {
    if (!confirm("Delete this story? All likes, comments, and views will be removed.")) return;
    try {
      const story = myStories.find(s => s.id === storyId);
      // Delete image from storage if exists
      if (story?.image_url) {
        const path = story.image_url.split("/public/")[1];
        if (path) {
          await supabase.storage.from("story-images").remove([path]);
        }
      }
      await supabase.from("client_posts").delete().eq("id", storyId);
      // Refresh stories
      const { data: stories } = await supabase
        .from("client_posts")
        .select("*")
        .eq("client_id", client.id)
        .gt("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order("created_at", { ascending: false });
      setMyStories(stories || []);
    } catch (err) {
      alert("Error deleting story: " + err.message);
    }
  };

  const logout = () => {
    sessionStorage.removeItem("clientId");
    sessionStorage.removeItem("clientUsername");
    router.push("/");
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8 flex items-center gap-6 border border-amber-100 flex-wrap">
          {client?.profile_pic ? (
            <img src={client.profile_pic} className="w-20 h-20 rounded-full object-cover border-4 border-amber-200" alt="Profile" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
              <UserIcon />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-amber-800">{client?.display_name || client?.username}</h1>
            <p className="text-sm text-gray-500">@{client?.username}</p>
            {client?.age && <p className="text-sm text-gray-600">Age: {client.age}</p>}
            {client?.skill && <p className="text-sm text-gray-600">Skill: {client.skill}</p>}
            <a href="/client/profile" className="text-sm text-amber-600 hover:underline">Edit Profile</a>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <button onClick={logout} className="text-red-600 hover:underline text-sm">Logout</button>
            <div className="relative">
              <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2 hover:bg-gray-100 rounded-full transition">
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
        </div>

        {/* Post a Story */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-amber-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Post a Story</h3>
          <form onSubmit={handlePostSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Choose Font</label>
              <select
                value={storyFont}
                onChange={(e) => setStoryFont(e.target.value)}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                style={{ fontFamily: storyFont }}
              >
                {FONT_OPTIONS.map((font) => (
                  <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                    {font.label}
                  </option>
                ))}
              </select>
            </div>
            <textarea
              value={storyContent}
              onChange={(e) => setStoryContent(e.target.value)}
              placeholder="What's on your mind? Share a project update, a thought, or a story..."
              rows="3"
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              style={{ fontFamily: storyFont }}
            />
            <div className="flex items-center gap-4">
              <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 p-2 rounded-lg transition flex items-center gap-2">
                <CameraIcon />
                <span>Add Image</span>
                <input type="file" accept="image/*" onChange={handleStoryImageChange} className="hidden" ref={fileInputRef} />
              </label>
              {storyImagePreview && (
                <div className="relative inline-block">
                  <img src={storyImagePreview} className="h-16 w-16 object-cover rounded-lg border" alt="Preview" />
                  <button type="button" onClick={cancelImage} className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-700">
                    <CloseIcon />
                  </button>
                </div>
              )}
            </div>
            <button type="submit" disabled={posting} className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg transition disabled:opacity-50">
              {posting ? "Posting..." : "Post Update"}
            </button>
            {postMessage && <p className={`text-sm ${postMessage.includes("Error") ? "text-red-500" : "text-green-600"}`}>{postMessage}</p>}
          </form>
        </div>

        {/* My Stories */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-amber-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">My Stories</h3>
          {myStories.length === 0 ? (
            <p className="text-gray-500">You haven't posted any stories yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myStories.map((story) => {
                const isEditing = editingStory === story.id;
                return (
                  <div key={story.id} className="border rounded-lg p-3 bg-gray-50 relative">
                    {isEditing ? (
                      // Edit mode
                      <div className="space-y-2">
                        <select
                          value={editFont}
                          onChange={(e) => setEditFont(e.target.value)}
                          className="w-full p-1 border rounded text-sm"
                          style={{ fontFamily: editFont }}
                        >
                          {FONT_OPTIONS.map((font) => (
                            <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                              {font.label}
                            </option>
                          ))}
                        </select>
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows="2"
                          className="w-full p-1 border rounded text-sm"
                          style={{ fontFamily: editFont }}
                        />
                        <div className="flex items-center gap-2">
                          <label className="cursor-pointer bg-gray-200 p-1 rounded text-xs">
                            Change Image
                            <input type="file" accept="image/*" onChange={handleEditImageChange} className="hidden" ref={editFileInputRef} />
                          </label>
                          {editImagePreview && (
                            <div className="relative inline-block">
                              <img src={editImagePreview} className="h-12 w-12 object-cover rounded border" alt="Edit" />
                              <button type="button" onClick={removeEditImage} className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">✕</button>
                            </div>
                          )}
                          {!editImagePreview && story.image_url && !editImageRemoved && (
                            <span className="text-xs text-gray-500">Current image (click Change Image to replace)</span>
                          )}
                        </div>
                        <div className="flex gap-2 mt-2">
                          <button onClick={() => saveEdit(story.id)} className="bg-green-600 text-white px-3 py-1 rounded text-sm">Save</button>
                          <button onClick={cancelEdit} className="bg-gray-300 px-3 py-1 rounded text-sm">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      // View mode
                      <>
                        {story.image_url && <img src={story.image_url} className="w-full h-32 object-cover rounded mb-2" alt="Story" />}
                        {story.content && <p className="text-sm" style={{ fontFamily: story.font_family || 'sans-serif' }}>{story.content}</p>}
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-xs text-gray-400">{new Date(story.created_at).toLocaleString()}</span>
                          <div className="flex gap-2">
                            <button onClick={() => startEdit(story)} className="text-blue-600 hover:underline text-xs flex items-center gap-1">
                              <EditIcon /> Edit
                            </button>
                            <button onClick={() => deleteStory(story.id)} className="text-red-600 hover:underline text-xs flex items-center gap-1">
                              <TrashIcon /> Delete
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Active Projects */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Active Projects</h2>
          {activeTokens.length === 0 ? (
            <p className="text-gray-500">No active projects right now.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeTokens.map((token) => (
                <div key={token.id} className="bg-white rounded-xl shadow-md p-6 border border-amber-100">
                  <p className="text-sm text-gray-500">Token: <span className="font-mono">{token.token_string}</span></p>
                  <p className="text-gray-700 mt-2">{token.work_description || "Project in progress"}</p>
                  <div className="flex gap-3 mt-4 flex-wrap">
                    <a href={`/workspace/${token.token_string}`} className="text-amber-600 hover:underline text-sm">View Workspace</a>
                    <a href={`/client/upload/${token.id}`} className="bg-amber-600 text-white px-4 py-1 rounded-full text-sm hover:bg-amber-700 transition">Share Update</a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Completed Projects */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Completed Projects</h2>
          {killedTokens.length === 0 ? (
            <p className="text-gray-500">No completed projects yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {killedTokens.map((token) => (
                <div key={token.id} className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                  <p className="text-sm text-gray-500">Token: <span className="font-mono">{token.token_string}</span> <span className="ml-2 text-green-600">✅ Completed</span></p>
                  <p className="text-gray-700 mt-2">{token.work_description || "Completed project"}</p>
                  <a href={`/workspace/${token.token_string}`} className="text-amber-600 hover:underline text-sm">View Public Page</a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}