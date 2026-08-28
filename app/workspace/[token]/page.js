"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useParams } from "next/navigation";
import { getOptimizedImage } from "@/lib/utils";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function WorkspacePage() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [progressImages, setProgressImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [client, setClient] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const [replyTarget, setReplyTarget] = useState(null);
  const [publicComment, setPublicComment] = useState("");
  const [publicCommentAuthor, setPublicCommentAuthor] = useState("");
  const [publicComments, setPublicComments] = useState([]);
  const router = useParams();

  // Client session
  useEffect(() => {
    const clientId = sessionStorage.getItem("clientId");
    if (clientId) {
      setIsLoggedIn(true);
      supabase.from("clients").select("*").eq("id", clientId).single().then(({ data }) => setClient(data));
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    async function fetchData() {
      const { data: tokenData, error: tokenError } = await supabase
        .from("tokens")
        .select("*")
        .eq("token_string", token)
        .single();
      if (tokenError || !tokenData) {
        setError("Invalid or expired token.");
        setLoading(false);
        return;
      }
      setData(tokenData);
      // Fetch progress images
      const { data: images } = await supabase
        .from("progress_images")
        .select("*, uploaded_by, clients!uploaded_by(display_name, username)")
        .eq("token_id", tokenData.id)
        .order("created_at", { ascending: true });
      setProgressImages(images || []);
      // If killed, fetch public comments
      if (tokenData.status === "killed") {
        const { data: comments } = await supabase
          .from("public_comments")
          .select("*")
          .eq("token_id", tokenData.id)
          .order("created_at", { ascending: false });
        setPublicComments(comments || []);
      }
      setLoading(false);
    }
    fetchData();
  }, [token]);

  const handleReply = async (progressImageId) => {
    if (!replyMessage.trim()) return;
    if (!isLoggedIn && !client) {
      alert("Please log in to reply.");
      return;
    }
    try {
      const { error } = await supabase.from("progress_comments").insert({
        progress_image_id: progressImageId,
        token_id: data.id,
        sender: "client",
        message: replyMessage,
      });
      if (error) throw error;
      // Create notification for admin
      await supabase.from("notifications").insert({
        token_id: data.id,
        type: "new_reply",
        message: `Client replied on token ${data.token_string}`,
      });
      setReplyMessage("");
      // Refresh comments (we'll fetch all again or just update state)
      const { data: updated } = await supabase
        .from("progress_comments")
        .select("*")
        .eq("progress_image_id", progressImageId);
      // For simplicity, we'll reload the page after a short delay
      window.location.reload();
    } catch (err) {
      alert("Error sending reply: " + err.message);
    }
  };

  const handlePublicComment = async () => {
    if (!publicComment.trim() || !publicCommentAuthor.trim()) {
      alert("Please enter your name and comment.");
      return;
    }
    try {
      const { error } = await supabase.from("public_comments").insert({
        token_id: data.id,
        author_name: publicCommentAuthor,
        message: publicComment,
      });
      if (error) throw error;
      setPublicComment("");
      setPublicCommentAuthor("");
      // Refresh comments
      const { data: comments } = await supabase
        .from("public_comments")
        .select("*")
        .eq("token_id", data.id)
        .order("created_at", { ascending: false });
      setPublicComments(comments || []);
    } catch (err) {
      alert("Error posting comment: " + err.message);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading workspace...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;

  const isActive = data.status === "active";

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-amber-900/90 via-amber-800/80 to-stone-800 py-12">
      <div className="container mx-auto px-6 max-w-4xl">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-6 md:p-8">
          <h1 className="text-3xl font-bold text-amber-800 mb-4">
            {isActive ? "Your Private Workspace" : "Completed Project"}
          </h1>
          {isActive && (
            <p className="text-gray-600 mb-4">
              Token: <span className="font-mono">{data.token_string}</span> — {data.client_name || "Client"}
            </p>
          )}
          {!isActive && (
            <p className="text-gray-600 mb-4">
              This project was completed on {new Date(data.created_at).toLocaleDateString()}. {data.client_name && `Client: ${data.client_name}`}
            </p>
          )}

          {/* Request Image */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Original Request</h2>
            {data.request_image_url ? (
              <img src={getOptimizedImage(data.request_image_url, 800)} className="w-full max-h-96 object-contain rounded-lg border border-gray-200" />
            ) : (
              <p className="text-gray-500">No request image uploaded.</p>
            )}
          </div>

          {/* Progress Timeline */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              {isActive ? "Progress Updates" : "Progress & Final Result"}
            </h2>
            {progressImages.length === 0 ? (
              <p className="text-gray-500">No progress updates yet.</p>
            ) : (
              <div className="space-y-8">
                {progressImages.map((img, idx) => {
                  const uploadedBy = img.uploaded_by ? (img.clients?.display_name || img.clients?.username || "Client") : "Admin";
                  const isClient = !!img.uploaded_by;
                  return (
                    <div key={idx} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
                      <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">
                          {isClient ? "👤 " + uploadedBy : "🛠️ Admin"} • {new Date(img.created_at).toLocaleDateString()}
                        </span>
                        {img.description && <span className="text-sm text-gray-500 italic">"{img.description}"</span>}
                      </div>
                      <img src={getOptimizedImage(img.image_url, 600)} className="w-full h-64 object-cover" />
                      {img.explanation && (
                        <div className="p-4 bg-gray-50 border-t border-gray-200">
                          <p className="text-gray-700 whitespace-pre-wrap">{img.explanation}</p>
                        </div>
                      )}
                      {/* Client/Admin Replies */}
                      <div className="p-4 bg-gray-50 border-t border-gray-200 space-y-2">
                        <p className="text-sm font-medium text-gray-600">Comments & Replies</p>
                        {/* We'd fetch and display replies here – for brevity, we'll show a placeholder */}
                        {/* In production, we'd fetch progress_comments for this progress_image_id */}
                        {isActive && isLoggedIn && (
                          <div className="flex gap-2 mt-2">
                            <input
                              type="text"
                              value={replyMessage}
                              onChange={(e) => setReplyMessage(e.target.value)}
                              placeholder="Reply to this update..."
                              className="flex-1 p-2 border rounded-lg text-sm"
                            />
                            <button onClick={() => handleReply(img.id)} className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-amber-700 transition">
                              Send
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Public Comments (if killed) */}
          {!isActive && (
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="text-xl font-semibold mb-4">Public Comments</h3>
              {publicComments.length === 0 ? (
                <p className="text-gray-500">No comments yet. Be the first to leave a comment!</p>
              ) : (
                <div className="space-y-4">
                  {publicComments.map((c) => (
                    <div key={c.id} className="bg-gray-50 p-4 rounded-lg">
                      <p className="font-semibold">{c.author_name}</p>
                      <p className="text-gray-700">{c.message}</p>
                      <p className="text-xs text-gray-400">{new Date(c.created_at).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4 flex flex-col gap-2">
                <input
                  type="text"
                  placeholder="Your name"
                  value={publicCommentAuthor}
                  onChange={(e) => setPublicCommentAuthor(e.target.value)}
                  className="p-2 border rounded-lg"
                />
                <textarea
                  placeholder="Your comment"
                  value={publicComment}
                  onChange={(e) => setPublicComment(e.target.value)}
                  rows="3"
                  className="p-2 border rounded-lg"
                />
                <button onClick={handlePublicComment} className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 transition">
                  Post Comment
                </button>
              </div>
              <div className="mt-4 flex gap-3">
                <button onClick={() => navigator.share({ title: "OKMADE Project", url: window.location.href })} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">Share</button>
                <a href={`https://wa.me/?text=${encodeURIComponent(window.location.href)}`} target="_blank" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">WhatsApp</a>
              </div>
            </div>
          )}

          {isActive && (
            <p className="text-blue-600 bg-blue-50 p-3 rounded-lg text-sm border border-blue-100 mt-4">
              Your custom piece is being crafted. Check back later for updates.
            </p>
          )}
          {!isActive && (
            <p className="text-green-600 bg-green-50 p-3 rounded-lg text-sm border border-green-100 mt-4">
              This project is complete! Thank you for choosing OKMADE Furniture.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
