"use client";
import { useState } from "react";
import Image from "next/image";
import ShareMenu from "./ShareMenu";
import ReportButton from "./ReportButton";
import { fetchWithRetry } from "@/lib/fetch-with-retry";
import { enqueue } from "@/lib/offline-queue";

const REACTIONS = [
  { type: "like", emoji: "👍", label: "Like" },
  { type: "love", emoji: "❤️", label: "Love" },
  { type: "haha", emoji: "😂", label: "Haha" },
  { type: "wow", emoji: "😮", label: "Wow" },
  { type: "sad", emoji: "😢", label: "Sad" },
  { type: "angry", emoji: "😡", label: "Angry" },
];

const BLUR = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxIDEiPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNmZWYzYzciLz48L3N2Zz4=";

const VerifiedBadge = ({ isOkmade }) => (
  <svg
    className={`w-4 h-4 inline-block flex-shrink-0 ${isOkmade ? "text-amber-500" : "text-blue-500"}`}
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M12 2l2.09 2.26 3.06-.46.63 3.02 2.81 1.31-1.24 2.83 1.24 2.83-2.81 1.31-.63 3.02-3.06-.46L12 20l-2.09-2.26-3.06.46-.63-3.02L3.41 13.87l1.24-2.83-1.24-2.83 2.81-1.31.63-3.02 3.06.46L12 2z" />
    <path d="M9.5 12.5l1.8 1.8 3.7-3.7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const getViewerId = () => {
  if (typeof window === "undefined") return "anonymous";
  let id = localStorage.getItem("okmade_viewer_id");
  if (!id) {
    id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
    localStorage.setItem("okmade_viewer_id", id);
  }
  return id;
};

export default function PostCard({
  post,
  currentUserId,
  onUpdate,
  showFullComments = false,
}) {
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
  const [localMessage, setLocalMessage] = useState("");
  const [content, setContent] = useState(post.content || "");
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(post.content || "");
  const [editSaving, setEditSaving] = useState(false);
  const [localCommentCount, setLocalCommentCount] = useState(post.commentCount || 0);
  const [menuOpen, setMenuOpen] = useState(false);

  const author = post.clients || {};
  const fullName = author.display_name || author.username || "User";
  const myReaction = localReactions.find((r) => r.user_id === currentUserId);
  const isMine = currentUserId && post.author_id === currentUserId;

  const reactionCounts = localReactions.reduce((acc, r) => {
    acc[r.reaction_type] = (acc[r.reaction_type] || 0) + 1;
    return acc;
  }, {});
  const totalReactions = localReactions.length;

  const handleReact = async (type) => {
    setShowReactions(false);
    const filtered = localReactions.filter((r) => r.user_id !== currentUserId);
    if (myReaction?.reaction_type === type) {
      setLocalReactions(filtered);
    } else {
      setLocalReactions([...filtered, { reaction_type: type, user_id: currentUserId }]);
    }

    if (!navigator.onLine) {
      enqueue({
        url: `/api/posts/${post.id}/react`,
        method: "POST",
        body: { reaction_type: type, viewer_id: getViewerId() },
        label: "Reaction",
      });
      return;
    }

    try {
      await fetchWithRetry(`/api/posts/${post.id}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reaction_type: type, viewer_id: getViewerId() }),
      });
      onUpdate?.();
    } catch {}
  };

  const loadComments = async () => {
    if (commentsLoaded) return;
    setLoadingComments(true);
    try {
      const res = await fetchWithRetry(`/api/posts/${post.id}`, {}, { retries: 1 });
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
        setCommentsLoaded(true);
      }
    } catch {}
    setLoadingComments(false);
  };

  const handleComment = async (parentId = null) => {
    if (!commentText.trim()) return;
    const text = commentText;
    const name = commentName;
    const email = commentEmail;

    setCommentText("");
    setReplyingTo(null);

    // Optimistic comment count
    setLocalCommentCount((c) => c + 1);

    if (!navigator.onLine) {
      enqueue({
        url: `/api/posts/${post.id}/comment`,
        method: "POST",
        body: {
          content: text,
          author_name: name || undefined,
          author_email: email || undefined,
          parent_id: parentId,
          viewer_id: getViewerId(),
        },
        label: "Comment",
      });
      setLocalMessage("Saved. Will post when back online.");
      setTimeout(() => setLocalMessage(""), 4000);
      return;
    }

    try {
      const res = await fetchWithRetry(`/api/posts/${post.id}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: text,
          author_name: name || undefined,
          author_email: email || undefined,
          parent_id: parentId,
          viewer_id: getViewerId(),
        }),
      });
      if (res.ok) {
        const newComment = await res.json();
        setComments((prev) => [...prev, newComment]);
      } else {
        setLocalCommentCount((c) => Math.max(0, c - 1));
        throw new Error();
      }
    } catch {
      enqueue({
        url: `/api/posts/${post.id}/comment`,
        method: "POST",
        body: {
          content: text,
          author_name: name || undefined,
          author_email: email || undefined,
          parent_id: parentId,
          viewer_id: getViewerId(),
        },
        label: "Comment",
      });
      setLocalMessage("Saved. Will retry automatically.");
      setTimeout(() => setLocalMessage(""), 4000);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this post?")) return;
    const res = await fetchWithRetry(`/api/posts/${post.id}`, { method: "DELETE" });
    if (res.ok) onUpdate?.();
    else alert("Delete failed.");
  };

  const handleSaveEdit = async () => {
    if (!editText.trim()) return;
    setEditSaving(true);
    try {
      const res = await fetchWithRetry(`/api/posts/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editText.trim() }),
      });
      if (res.ok) {
        setContent(editText.trim());
        setEditing(false);
        setMenuOpen(false);
      } else {
        alert("Save failed.");
      }
    } catch {
      alert("Network error.");
    } finally {
      setEditSaving(false);
    }
  };

  const topLevel = comments.filter((c) => !c.parent_id);
  const visibleComments = showAllComments ? topLevel : topLevel.slice(0, 2);

  const imageCount = post.image_urls?.length || 0;
  const singleImage = imageCount === 1;
  const postUrl =
    typeof window !== "undefined" && author.username
      ? `${window.location.origin}/client/${author.username}`
      : "";

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="p-4 flex items-start gap-3">
        {author.profile_pic ? (
          <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
            <Image
              src={author.profile_pic}
              alt={fullName}
              fill
              sizes="40px"
              className="object-cover"
              placeholder="blur"
              blurDataURL={BLUR}
            />
          </div>
        ) : (
          <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold flex-shrink-0">
            {fullName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <a
              href={`/client/${author.username}`}
              className="font-semibold text-gray-900 dark:text-gray-100 hover:underline truncate"
            >
              {fullName}
            </a>
            {author.is_okmade ? (
              <VerifiedBadge isOkmade />
            ) : author.verified ? (
              <VerifiedBadge isOkmade={false} />
            ) : null}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {timeAgo(post.created_at)}
            {post.is_auto && " · Auto-update"}
            {post.edited_at && " · edited"}
          </p>
        </div>
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <ShareMenu
            url={postUrl}
            title={`${fullName} on OKMADE`}
            text={content ? content.slice(0, 100) : "Check this on OKMADE"}
            iconOnly
          />
          {isMine && (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition text-gray-500 dark:text-gray-400"
                aria-label="Options"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01" />
                </svg>
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
                    <button
                      onClick={() => {
                        setEditing(true);
                        setMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-amber-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm"
                    >
                      Edit post
                    </button>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        handleDelete();
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 text-sm border-t border-gray-100 dark:border-gray-800"
                    >
                      Delete post
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content or edit mode */}
      {editing ? (
        <div className="px-4 pb-3">
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            rows="3"
            className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-amber-500"
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleSaveEdit}
              disabled={editSaving}
              className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {editSaving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={() => {
                setEditing(false);
                setEditText(content);
              }}
              className="bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 px-3 py-1.5 rounded-lg text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        content && (
          <div className="px-4 pb-3">
            <p
              className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap"
              style={{ fontFamily: post.font_family || "sans-serif" }}
            >
              {content}
            </p>
          </div>
        )
      )}

      {/* Images */}
      {imageCount > 0 && (
        <div className={`grid gap-1 ${singleImage ? "grid-cols-1" : "grid-cols-2"}`}>
          {post.image_urls.map((url, i) => (
            <div
              key={i}
              className={`relative w-full ${singleImage ? "aspect-[4/3]" : "aspect-square"}`}
            >
              <Image
                src={url}
                alt=""
                fill
                sizes={
                  singleImage
                    ? "(max-width: 768px) 100vw, 700px"
                    : "(max-width: 768px) 50vw, 350px"
                }
                className="object-cover"
                placeholder="blur"
                blurDataURL={BLUR}
                priority={i === 0 && !post.is_auto}
              />
            </div>
          ))}
        </div>
      )}

      {/* Counts bar */}
      {(totalReactions > 0 || localCommentCount > 0) && (
        <div className="px-4 py-2 flex justify-between text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-800">
          <span className="flex items-center gap-1">
            {Object.entries(reactionCounts).map(([type]) => {
              const emoji = REACTIONS.find((r) => r.type === type)?.emoji;
              return <span key={type}>{emoji}</span>;
            })}
            {totalReactions}
          </span>
          <button
            onClick={() => {
              loadComments();
              setShowAllComments(true);
            }}
            className="hover:underline"
          >
            {localCommentCount} comments
          </button>
        </div>
      )}

      {/* Action bar */}
      <div className="border-t border-gray-100 dark:border-gray-800 px-2 flex">
        <div
          className="relative flex-1"
          onMouseEnter={() => setShowReactions(true)}
          onMouseLeave={() => setShowReactions(false)}
        >
          <button
            onClick={() => handleReact("like")}
            className={`w-full py-2 text-sm font-medium flex items-center justify-center gap-2 transition ${
              myReaction
                ? "text-amber-600 dark:text-amber-400"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
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
            <div className="absolute bottom-full left-0 mb-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-full shadow-lg px-2 py-1 flex gap-1 z-10">
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
          onClick={() => {
            loadComments();
            setShowAllComments(!showAllComments);
          }}
          className="flex-1 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-center"
        >
          💬 Comment
        </button>
        <ReportButton postId={post.id} iconOnly />
      </div>

      {localMessage && (
        <div className="px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border-t border-amber-100 dark:border-amber-800 text-xs text-amber-700 dark:text-amber-300">
          {localMessage}
        </div>
      )}

      {/* Comments */}
      {showAllComments && (
        <div className="border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 p-4 space-y-3">
          {loadingComments && (
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading comments...</p>
          )}
          {visibleComments.map((c) => {
            const replies = comments.filter((r) => r.parent_id === c.id);
            return (
              <div key={c.id}>
                <div
                  className={`p-3 rounded-lg ${
                    c.is_guest
                      ? "bg-white dark:bg-gray-900"
                      : "bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                      {c.author_name}
                    </span>
                    {c.is_guest ? (
                      <span className="text-xs bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">
                        GUEST
                      </span>
                    ) : (
                      <span className="text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full">
                        ARTISAN
                      </span>
                    )}
                    <span className="text-xs text-gray-400">{timeAgo(c.created_at)}</span>
                    <ReportButton commentId={c.id} iconOnly />
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{c.content}</p>
                  <button
                    onClick={() => setReplyingTo(c.id)}
                    className="text-xs text-amber-600 dark:text-amber-400 hover:underline mt-1"
                  >
                    Reply
                  </button>
                </div>
                {replies.map((r) => (
                  <div
                    key={r.id}
                    className="ml-6 mt-2 p-2 bg-white dark:bg-gray-900 rounded-lg border-l-2 border-amber-200 dark:border-amber-800"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                        {r.author_name}
                      </span>
                      {r.is_guest ? (
                        <span className="text-xs bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">
                          GUEST
                        </span>
                      ) : (
                        <span className="text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full">
                          ARTISAN
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{r.content}</p>
                  </div>
                ))}
                {replyingTo === c.id && (
                  <div className="ml-6 mt-2 flex gap-2">
                    <input
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Write a reply..."
                      className="flex-1 p-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100"
                    />
                    <button
                      onClick={() => handleComment(c.id)}
                      className="bg-amber-600 text-white px-3 py-2 rounded-lg text-sm"
                    >
                      Reply
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {!replyingTo && (
            <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-800">
              {!currentUserId && (
                <div className="flex gap-2 flex-wrap">
                  <input
                    type="text"
                    placeholder="Your name *"
                    value={commentName}
                    onChange={(e) => setCommentName(e.target.value)}
                    className="flex-1 min-w-[140px] p-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100"
                  />
                  <input
                    type="email"
                    placeholder="Email (optional)"
                    value={commentEmail}
                    onChange={(e) => setCommentEmail(e.target.value)}
                    className="flex-1 min-w-[140px] p-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100"
                  />
                </div>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Write a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="flex-1 p-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100"
                />
                <button
                  onClick={() => handleComment(null)}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                >
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
