"use client";
import { useEffect, useState, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function ClientDashboard() {
  const [client, setClient] = useState(null);
  const [activeTokens, setActiveTokens] = useState([]);
  const [killedTokens, setKilledTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [storyContent, setStoryContent] = useState("");
  const [storyImage, setStoryImage] = useState(null);
  const [storyImagePreview, setStoryImagePreview] = useState("");
  const [storyFont, setStoryFont] = useState("sans-serif");
  const [posting, setPosting] = useState(false);
  const [postMessage, setPostMessage] = useState("");
  const fileInputRef = useRef(null);
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
    const { data: tokens } = await supabase
      .from("tokens")
      .select("id, token_string, status, created_at, work_description")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });
    setActiveTokens(tokens?.filter(t => t.status === "active") || []);
    setKilledTokens(tokens?.filter(t => t.status === "killed") || []);
    setLoading(false);
  }

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
      setPostMessage("Story posted successfully!");
      setStoryContent("");
      setStoryImage(null);
      setStoryImagePreview("");
      setStoryFont("sans-serif");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setPostMessage("Error: " + err.message);
    } finally {
      setPosting(false);
    }
  };

  const logout = () => {
    sessionStorage.removeItem("clientId");
    sessionStorage.removeItem("clientUsername");
    router.push("/");
  };

  if (loading) return <div className="p-8 text-center">Loading your dashboard...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8 flex items-center gap-6 border border-amber-100 flex-wrap">
          {client?.profile_pic ? (
            <img
              src={client.profile_pic}
              className="w-20 h-20 rounded-full object-cover border-4 border-amber-200"
              alt="Profile"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-3xl border-4 border-amber-200">
              👤
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-amber-800">
              {client?.display_name || client?.username}
            </h1>
            <p className="text-sm text-gray-500">@{client?.username}</p>
            {client?.age && <p className="text-sm text-gray-600">Age: {client.age}</p>}
            {client?.skill && <p className="text-sm text-gray-600">Skill: {client.skill}</p>}
            <a href="/client/profile" className="text-sm text-amber-600 hover:underline">Edit Profile</a>
          </div>
          <div className="ml-auto">
            <button onClick={logout} className="text-red-600 hover:underline text-sm">Logout</button>
          </div>
        </div>

        {/* Post a Story */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-amber-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">📝 Post a Story / Update</h3>
          <form onSubmit={handlePostSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Choose Font</label>
              <select
                value={storyFont}
                onChange={(e) => setStoryFont(e.target.value)}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
              >
                <option value="sans-serif">Sans-serif</option>
                <option value="serif">Serif</option>
                <option value="cursive">Cursive</option>
                <option value="monospace">Monospace</option>
                <option value="'Dancing Script', cursive">Handwriting</option>
              </select>
            </div>
            <textarea
              value={storyContent}
              onChange={(e) => setStoryContent(e.target.value)}
              placeholder="What's on your mind? Share a project update, a thought, or a story..."
              rows="3"
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Add an image (optional)</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleStoryImageChange}
                className="w-full p-2 border rounded-lg"
              />
              {storyImagePreview && (
                <div className="relative mt-2 inline-block">
                  <img src={storyImagePreview} className="h-24 w-24 object-cover rounded-lg border" alt="Preview" />
                  <button
                    type="button"
                    onClick={cancelImage}
                    className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-700"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={posting}
              className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg transition disabled:opacity-50"
            >
              {posting ? "Posting..." : "Post Update"}
            </button>
            {postMessage && <p className={`text-sm ${postMessage.includes("Error") ? "text-red-500" : "text-green-600"}`}>{postMessage}</p>}
          </form>
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