"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useParams } from "next/navigation";
import { getOptimizedImage } from "@/lib/utils";
import { LocationIcon, ClockIcon } from "@/lib/icons";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const HeartIcon = ({ filled }) => (
  <svg className={`w-6 h-6 ${filled ? "text-red-500" : "text-gray-400"}`} fill={filled ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
);

const REACTIONS = [
  { type: "like", emoji: "👍" },
  { type: "love", emoji: "❤️" },
  { type: "haha", emoji: "😂" },
  { type: "wow", emoji: "😮" },
  { type: "sad", emoji: "😢" },
  { type: "angry", emoji: "😡" },
];

const getViewerId = () => {
  if (typeof window === "undefined") return "anonymous";
  let id = localStorage.getItem("viewer_id");
  if (!id) {
    id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
    localStorage.setItem("viewer_id", id);
  }
  return id;
};

export default function WorkspacePage() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [requestImages, setRequestImages] = useState([]);
  const [progressImages, setProgressImages] = useState([]);
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [reactions, setReactions] = useState([]);
  const [comments, setComments] = useState([]);
  const [commentName, setCommentName] = useState("");
  const [commentEmail, setCommentEmail] = useState("");
  const [commentContent, setCommentContent] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const viewerId = getViewerId();

  useEffect(() => {
    if (!token) return;
    async function fetchWorkspace() {
      let projectData = null;
      const { data: byToken, error: tokenError } = await supabase.from("projects").select("*").eq("token_string", token).single();
      if (!tokenError && byToken) projectData = byToken;
      else {
        const { data: byId, error: idError } = await supabase.from("projects").select("*").eq("id", token).single();
        if (!idError && byId) projectData = byId;
      }

      if (!projectData) {
        setError("Invalid or expired project link.");
        setLoading(false);
        return;
      }
      setData(projectData);

      if (projectData.category_id) {
        const { data: cat } = await supabase.from("categories").select("name").eq("id", projectData.category_id).single();
        setCategory(cat);
      }

      const { data: reqImages } = await supabase.from("project_request_images").select("image_url, description, display_order").eq("project_id", projectData.id).order("display_order", { ascending: true });
      setRequestImages(reqImages || []);

      const { data: progImages } = await supabase.from("progress_images").select("image_url, uploaded_at, description, explanation").eq("project_id", projectData.id).order("uploaded_at", { ascending: true });
      setProgressImages(progImages || []);

      if (projectData.status === "killed") {
        const { count: likes } = await supabase.from("project_likes").select("*", { count: "exact", head: true }).eq("project_id", projectData.id);
        setLikeCount(likes || 0);

        const { data: myLike } = await supabase.from("project_likes").select("id").eq("project_id", projectData.id).eq("user_id", viewerId).single();
        setLiked(!!myLike);

        const { data: reacts } = await supabase.from("story_reactions").select("reaction_type, user_id").eq("story_id", projectData.id);
        setReactions(reacts || []);

        const { data: comms } = await supabase.from("public_comments").select("*").eq("project_id", projectData.id).order("created_at", { ascending: true });
        setComments(comms || []);
      }
      setLoading(false);
    }
    fetchWorkspace();
  }, [token]);

  const toggleLike = async () => {
    if (!data || data.status !== "killed") return;
    if (liked) {
      await supabase.from("project_likes").delete().eq("project_id", data.id).eq("user_id", viewerId);
      setLiked(false);
      setLikeCount((c) => Math.max(0, c - 1));
    } else {
      await supabase.from("project_likes").insert({ project_id: data.id, user_id: viewerId });
      setLiked(true);
      setLikeCount((c) => c + 1);
    }
  };

  const toggleReaction = async (type) => {
    if (!data || data.status !== "killed") return;
    const existing = reactions.find((r) => r.reaction_type === type && r.user_id === viewerId);
    if (existing) {
      await supabase.from("story_reactions").delete().eq("story_id", data.id).eq("user_id", viewerId).eq("reaction_type", type);
      setReactions(reactions.filter((r) => !(r.reaction_type === type && r.user_id === viewerId)));
    } else {
      await supabase.from("story_reactions").insert({ story_id: data.id, user_id: viewerId, reaction_type: type });
      setReactions([...reactions, { reaction_type: type, user_id: viewerId }]);
    }
  };

  const postComment = async (parentId = null) => {
    if (!commentContent.trim() || !commentName.trim()) {
      alert("Please enter your name and comment.");
      return;
    }
    setSubmitting(true);
    try {
      const { data: inserted, error: insertError } = await supabase.from("public_comments").insert({
        project_id: data.id,
        parent_id: parentId,
        author_name: commentName,
        author_email: commentEmail || null,
        message: commentContent,
      }).select().single();
      if (insertError) throw insertError;
      setComments([...comments, inserted]);
      setCommentContent("");
      setReplyingTo(null);
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-900/90 via-amber-800/80 to-stone-800"><div className="text-amber-200 text-xl animate-pulse">Loading project...</div></div>;
  if (error) return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-900/90 via-amber-800/80 to-stone-800"><div className="bg-white/10 backdrop-blur-sm text-white p-8 rounded-xl border border-white/10 text-center"><p className="text-red-400 text-xl">{error}</p></div></div>;

  const isActive = data.status === "active";
  const reactionCounts = reactions.reduce((acc, r) => { acc[r.reaction_type] = (acc[r.reaction_type] || 0) + 1; return acc; }, {});

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-amber-900/90 via-amber-800/80 to-stone-800 py-12">
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} />
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-amber-400/20 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-orange-300/15 blur-3xl pointer-events-none"></div>

      <div className="relative z-10 container mx-auto px-6 py-12 max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-bold text-center text-white mb-3 font-['Dancing_Script',_cursive] drop-shadow-lg">{isActive ? "Project In Progress" : "Completed Project"}</h1>
        <p className="text-center text-amber-200 mb-8 text-lg">{data.work_description || "Untitled Project"}</p>

        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-6 md:p-8 space-y-6 border border-white/20">
          <div className="flex flex-wrap gap-4 text-sm text-gray-600 border-b border-gray-200 pb-4 items-center">
            {data.token_string && <span>Token: <span className="font-mono font-semibold">{data.token_string}</span></span>}
            {data.city && <span className="flex items-center gap-1"><LocationIcon className="w-4 h-4" /> {data.city}</span>}
            {data.duration_weeks && <span className="flex items-center gap-1"><ClockIcon className="w-4 h-4" /> {data.duration_weeks} weeks</span>}
            {category && <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs">{category.name}</span>}
          </div>

          {!isActive && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-gray-800">Are you happy with this project?</p>
                <p className="text-xs text-gray-500 mt-1">Click the heart if this work impressed you.</p>
              </div>
              <button onClick={toggleLike} className={`flex items-center gap-2 px-5 py-2 rounded-full font-medium transition border ${liked ? "bg-red-500 text-white border-red-500 hover:bg-red-600" : "bg-white text-red-500 border-red-300 hover:bg-red-50"}`}>
                <HeartIcon filled={liked} />
                <span>{likeCount} {likeCount === 1 ? "Like" : "Likes"}</span>
              </button>
            </div>
          )}

          {data.project_details && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Project Details</h2>
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{data.project_details}</p>
            </div>
          )}

          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Original Request</h2>
            {requestImages.length === 0 ? <p className="text-gray-500">No request images uploaded.</p> : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {requestImages.map((img, idx) => (
                  <div key={idx} className="bg-white rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                    <img src={getOptimizedImage(img.image_url, 350)} loading="lazy" className="w-full h-48 object-cover" alt={`Request ${idx + 1}`} />
                    {img.description && <div className="p-2 text-sm text-gray-600 border-t border-gray-100">{img.description}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">{isActive ? "Work in Progress" : "Final Result & Progress"}</h2>
            {progressImages.length === 0 ? <p className="text-gray-500">No progress images yet.</p> : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {progressImages.map((img, idx) => (
                  <div key={idx} className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
                    <img src={getOptimizedImage(img.image_url, 400)} loading="lazy" className="w-full h-64 object-cover" alt="Progress" />
                    {(img.description || img.explanation) && (
                      <div className="p-3 bg-gray-50 border-t border-gray-100">
                        {img.description && <p className="text-sm font-medium text-gray-700">{img.description}</p>}
                        {img.explanation && <p className="text-xs text-gray-500 mt-1">{img.explanation}</p>}
                        <p className="text-xs text-gray-400 mt-1">{new Date(img.uploaded_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {data.client_name && !data.is_standalone && <p className="text-gray-700 font-medium">Client: {data.client_name}</p>}

          {!isActive && (
            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-3">React to this Project</h2>
              <div className="flex flex-wrap gap-2">
                {REACTIONS.map(({ type, emoji }) => {
                  const count = reactionCounts[type] || 0;
                  const hasReacted = reactions.some((r) => r.reaction_type === type && r.user_id === viewerId);
                  return (
                    <button key={type} onClick={() => toggleReaction(type)} className={`px-3 py-2 rounded-full border text-sm transition ${hasReacted ? "bg-amber-100 border-amber-400" : "bg-gray-50 border-gray-200 hover:bg-gray-100"}`}>
                      {emoji} {count > 0 && count}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {!isActive && (
            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Public Comments</h2>
              <div className="mb-6 space-y-2">
                <div className="flex gap-2">
                  <input type="text" placeholder="Your name *" value={commentName} onChange={(e) => setCommentName(e.target.value)} className="flex-1 p-2 border rounded-lg text-sm" />
                  <input type="email" placeholder="Email (optional)" value={commentEmail} onChange={(e) => setCommentEmail(e.target.value)} className="flex-1 p-2 border rounded-lg text-sm" />
                </div>
                <div className="flex gap-2">
                  <input type="text" placeholder="Write a comment..." value={commentContent} onChange={(e) => setCommentContent(e.target.value)} className="flex-1 p-2 border rounded-lg text-sm" />
                  <button onClick={() => postComment(null)} disabled={submitting} className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-amber-700 transition disabled:opacity-50">{submitting ? "..." : "Comment"}</button>
                </div>
              </div>

              {comments.length === 0 ? (
                <p className="text-gray-500 text-sm">No comments yet. Be the first to leave one!</p>
              ) : (
                <div className="space-y-3">
                  {comments.filter((c) => !c.parent_id).map((parent) => (
                    <div key={parent.id} className="space-y-2">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm font-semibold text-gray-800">{parent.author_name}</p>
                        <p className="text-sm text-gray-700 mt-1">{parent.message}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <p className="text-xs text-gray-400">{new Date(parent.created_at).toLocaleString()}</p>
                          <button onClick={() => setReplyingTo(parent.id)} className="text-xs text-amber-600 hover:underline">Reply</button>
                        </div>
                        {replyingTo === parent.id && (
                          <div className="mt-3 flex gap-2">
                            <input type="text" placeholder="Write a reply..." value={commentContent} onChange={(e) => setCommentContent(e.target.value)} className="flex-1 p-2 border rounded-lg text-sm" />
                            <button onClick={() => postComment(parent.id)} disabled={submitting} className="bg-gray-600 text-white px-3 py-2 rounded text-sm hover:bg-gray-700 disabled:opacity-50">Reply</button>
                          </div>
                        )}
                      </div>
                      {comments.filter((c) => c.parent_id === parent.id).map((reply) => (
                        <div key={reply.id} className="bg-gray-50 p-3 rounded-lg ml-6 border-l-2 border-amber-200">
                          <p className="text-sm font-semibold text-gray-800">{reply.author_name}</p>
                          <p className="text-sm text-gray-700 mt-1">{reply.message}</p>
                          <p className="text-xs text-gray-400 mt-2">{new Date(reply.created_at).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {isActive ? (
            <p className="text-blue-600 bg-blue-50 p-3 rounded-lg text-sm border border-blue-100">Your custom piece is being crafted. Check back later for updates.</p>
          ) : (
            <p className="text-green-600 bg-green-50 p-3 rounded-lg text-sm border border-green-100">Work completed! Thank you for choosing OKMADE Furniture.</p>
          )}
        </div>
      </div>
    </div>
  );
}
