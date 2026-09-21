"use client";
import { useState } from "react";
import { getOptimizedImage, thumbImage } from "@/lib/utils";

const REACTIONS = [
  { type: "like", emoji: "👍", label: "Like" },
  { type: "love", emoji: "❤️", label: "Love" },
  { type: "haha", emoji: "😂", label: "Haha" },
  { type: "wow", emoji: "😮", label: "Wow" },
  { type: "sad", emoji: "😢", label: "Sad" },
  { type: "angry", emoji: "😡", label: "Angry" },
];

const IconCheck = () => (
  <svg className="w-4 h-4 inline-block" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
  </svg>
);

function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function PostCard({ post, currentUserId, onUpdate, showFullComments = false }) {
  const [showReactions, setShowReactions] = useState(false);
  const [localReactions, setLocalReactions] = useState(post.reactions || []);
  const [comments, setComments] = useState([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [showAllComments, setShowAllComments] = useState(showFullComments);
  const [commentName, setCommentName] = useState("");
  const [commentEmail, setCommentEmail] = useState("");
  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [loadingComments, setLoadingComments] = useState(false);

  const author = post.clients || {};
  const fullName = author.display_name || author.username || "User";

  const myReaction = localReactions.find((r) => r.user_id === currentUserId);

  const reactionCounts = localReactions.reduce((acc, r) => {
    acc[r.reaction_type] = (acc[r.reaction_type] || 0) + 1;
    return acc;
  }, {});

  const totalReactions = localReactions.length;

  const handleReact = async (type) => {
    setShowReactions(false);
    const res = await fetch(`/api/posts/${post.id}/react`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reaction_type: type }),
    });
    if (!res.ok) return;

    const filtered = localReactions.filter((r) => r.user_id !== currentUserId);
    if (myReaction?.reaction_type === type) {
      setLocalReactions(filtered);
    } else {
      setLocalReactions([...filtered, { reaction_type: type, user_id: currentUserId }]);
    }
    onUpdate?.();
  };

  const loadComments = async () => {
    if (commentsLoaded) return;
    setLoadingComments(true);
    const res = await fetch(`/api/posts/${post.id}`);
    if (res.ok) {
      const data = await res.json();
      setComments(data.comments || []);
      setCommentsLoaded(true);
    }
    setLoadingComments(false);
  };

  const handleComment = async (parentId = null) => {
    if (!commentText.trim()) return;
    const res = await fetch(`/api/posts/${post.id}/comment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: commentText,
        author_name: commentName || undefined,
        author_email: commentEmail || undefined,
        parent_id: parentId,
      }),
    });
    if (res.ok) {
      const newComment = await res.json();
      setComments([...comments, newComment]);
      setCommentText("");
      setReplyingTo(null);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this post?")) return;
    const res = await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
    if (res.ok) onUpdate?.();
  };

  const topLevel = comments.filter((c) => !c.parent_id);
  const visibleComments = showAllComments ? topLevel : topLevel.slice(0, 2);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 flex items-start gap-3">
        {author.profile_pic ? (
          <img src={thumbImage(author.profile_pic)} loading="lazy" className="w-10 h-10 rounded-full object-cover" alt="" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
            {fullName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-1">
            <a href={`/client/${author.username}`} className="font-semibold text-gray-900 hover:underline">
              {fullName}
            </a>
            {author.is_okmade && (
              <span className="text-amber-500" title="Official">
                <IconCheck />
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500">
            {timeAgo(post.created_at)}
            {post.is_auto && " · Auto-update"}
          </p>
        </div>
        {currentUserId && post.author_id === currentUserId && (
          <button onClick={handleDelete} className="text-gray-400 hover:text-red-600 text-sm">
            Delete
          </button>
        )}
      </div>

      {/* Content */}
      {post.content && (
        <div className="px-4 pb-3">
          <p className="text-gray-800 whitespace-pre-wrap" style={{ fontFamily: post.font_family || "sans-serif" }}>
            {post.content}
          </p>
        </div>
      )}

      {/* Images */}
      {post.image_urls && post.image_urls.length > 0 && (
        <div className={`grid gap-1 ${post.image_urls.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
          {post.image_urls.map((url, i) => (
            <img
              key={i}
              src={getOptimizedImage(url, post.image_urls.length === 1 ? 700 : 400, 70)}
              loading="lazy"
              className={`w-full object-cover ${post.image_urls.length === 1 ? "max-h-96" : "h-48"}`}
              alt=""
            />
          ))}
        </div>
      )}

      {/* Counts Bar */}
      {(totalReactions > 0 || post.commentCount > 0) && (
        <div className="px-4 py-2 flex justify-between text-xs text-gray-500 border-t border-gray-100">
          <span className="flex items-center gap-1">
            {Object.entries(reactionCounts).map(([type, count]) => {
              const emoji = REACTIONS.find((r) => r.type === type)?.emoji;
              return <span key={type}>{emoji}</span>;
            })}
            {totalReactions}
          </span>
          <button onClick={() => { loadComments(); setShowAllComments(true); }} className="hover:underline">
            {post.commentCount} comments
          </button>
        </div>
      )}

      {/* Action Bar */}
      <div className="border-t border-gray-100 px-2 flex">
        <div className="relative flex-1" onMouseEnter={() => setShowReactions(true)} onMouseLeave={() => setShowReactions(false)}>
          <button
            onClick={() => handleReact("like")}
            className={`w-full py-2 text-sm font-medium flex items-center justify-center gap-2 transition ${
              myReaction ? "text-amber-600" : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            {myReaction ? (
              <>
                <span>{REACTIONS.find((r) => r.type === myReaction.reaction_type)?.emoji}</span>
                {REACTIONS.find((r) => r.type === myReaction.reaction_type)?.label}
              </>
            ) : (
              <>👍 Like</>
            )}
          </button>
          {showReactions && (
            <div className="absolute bottom-full left-0 mb-1 bg-white border border-gray-200 rounded-full shadow-lg px-2 py-1 flex gap-1 z-10">
              {REACTIONS.map(({ type, emoji, label }) => (
                <button
                  key={type}
                  onClick={() => handleReact(type)}
                  className="hover:scale-125 transition-transform text-2xl p-1"
                  title={label}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={() => { loadComments(); setShowAllComments(!showAllComments); }}
          className="flex-1 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 flex items-center justify-center"
        >
          💬 Comment
        </button>
      </div>

      {/* Comments */}
      {showAllComments && (
        <div className="border-t border-gray-100 bg-gray-50 p-4 space-y-3">
          {loadingComments && <p className="text-sm text-gray-500">Loading comments...</p>}
          {visibleComments.map((c) => {
            const replies = comments.filter((r) => r.parent_id === c.id);
            return (
              <div key={c.id}>
                <div className={`p-3 rounded-lg ${c.is_guest ? "bg-white" : "bg-amber-50 border border-amber-100"}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-gray-800">{c.author_name}</span>
                    {c.is_guest ? (
                      <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">GUEST</span>
                    ) : (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">ARTISAN</span>
                    )}
                    <span className="text-xs text-gray-400">{timeAgo(c.created_at)}</span>
                  </div>
                  <p className="text-sm text-gray-700">{c.content}</p>
                  <button onClick={() => setReplyingTo(c.id)} className="text-xs text-amber-600 hover:underline mt-1">
                    Reply
                  </button>
                </div>
                {replies.map((r) => (
                  <div key={r.id} className="ml-6 mt-2 p-2 bg-white rounded-lg border-l-2 border-amber-200">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-gray-800">{r.author_name}</span>
                      {r.is_guest ? (
                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">GUEST</span>
                      ) : (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">ARTISAN</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700">{r.content}</p>
                  </div>
                ))}
                {replyingTo === c.id && (
                  <div className="ml-6 mt-2 flex gap-2">
                    <input
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Write a reply..."
                      className="flex-1 p-2 border rounded-lg text-sm"
                    />
                    <button onClick={() => handleComment(c.id)} className="bg-amber-600 text-white px-3 py-2 rounded-lg text-sm">
                      Reply
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {!replyingTo && (
            <div className="space-y-2 pt-2 border-t border-gray-200">
              {!currentUserId && (
                <div className="flex gap-2">
                  <input type="text" placeholder="Your name *" value={commentName} onChange={(e) => setCommentName(e.target.value)} className="flex-1 p-2 border rounded-lg text-sm" />
                  <input type="email" placeholder="Email (optional)" value={commentEmail} onChange={(e) => setCommentEmail(e.target.value)} className="flex-1 p-2 border rounded-lg text-sm" />
                </div>
              )}
              <div className="flex gap-2">
                <input type="text" placeholder="Write a comment..." value={commentText} onChange={(e) => setCommentText(e.target.value)} className="flex-1 p-2 border rounded-lg text-sm" />
                <button onClick={() => handleComment(null)} className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                  Comment
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
