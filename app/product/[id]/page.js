"use client";
import { useEffect, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { WhatsAppIcon, CloseIcon } from "@/lib/icons";
import Navbar from "@/app/components/Navbar";
import ShareMenu from "@/app/components/ShareMenu";
import { fetchWithRetry } from "@/lib/fetch-with-retry";
import { enqueue } from "@/lib/offline-queue";

const supabase = createSupabaseBrowser();

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "";

const BLUR =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxIDEiPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNmZWYzYzciLz48L3N2Zz4=";

const HeartIcon = ({ filled, className = "w-5 h-5" }) => (
  <svg className={className} fill={filled ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
);

const REACTIONS = [
  { type: "like", emoji: "👍" },
  { type: "heart", emoji: "❤️" },
  { type: "love", emoji: "😍" },
  { type: "haha", emoji: "😂" },
  { type: "wow", emoji: "😮" },
  { type: "sad", emoji: "😢" },
];

function StarRating({ rating, interactive = false, onChange = null, size = "text-xl" }) {
  const [hoverRating, setHoverRating] = useState(0);
  const display = interactive ? hoverRating || rating : rating;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={interactive ? () => onChange(star) : undefined}
          onMouseEnter={interactive ? () => setHoverRating(star) : undefined}
          onMouseLeave={interactive ? () => setHoverRating(0) : undefined}
          className={`${size} ${interactive ? "cursor-pointer" : "cursor-default"} ${
            star <= display ? "text-yellow-500" : "text-gray-300 dark:text-gray-600"
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

const getViewerId = () => {
  if (typeof window === "undefined") return "anonymous";
  let id = localStorage.getItem("viewer_id");
  if (!id) {
    id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
    localStorage.setItem("viewer_id", id);
  }
  return id;
};

export default function ProductDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [product, setProduct] = useState(null);
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [userName, setUserName] = useState("");
  const [userRating, setUserRating] = useState(5);
  const [userComment, setUserComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [reviewReactions, setReviewReactions] = useState({});
  const [reviewComments, setReviewComments] = useState({});
  const [replyOpenFor, setReplyOpenFor] = useState(null);
  const [replyName, setReplyName] = useState("");
  const [replyMessage, setReplyMessage] = useState("");
  const [replyIsAdmin, setReplyIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const viewerId = getViewerId();
  const isAdmin =
    typeof window !== "undefined" && sessionStorage.getItem("adminAuth") === "true";

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  async function fetchData() {
    setLoading(true);
    const [prodRes, imgsRes, revsRes, relatedRes] = await Promise.all([
      supabase.from("showroom").select("*").eq("id", id).single(),
      supabase.from("product_images").select("image_url").eq("product_id", id).order("display_order"),
      supabase.from("ratings").select("*").eq("product_id", id).order("created_at", { ascending: false }),
      supabase.from("showroom").select("id, description, price, sold").neq("id", id).limit(3),
    ]);

    if (prodRes.error || !prodRes.data) {
      setLoading(false);
      return;
    }

    setProduct(prodRes.data);
    setImages(imgsRes.data || []);
    if (imgsRes.data && imgsRes.data.length) setSelectedImage(imgsRes.data[0].image_url);

    const revs = revsRes.data || [];
    setRatings(revs);
    if (revs.length) {
      const sum = revs.reduce((a, b) => a + b.rating, 0);
      setAvgRating(sum / revs.length);
    }

    setRelatedProducts(relatedRes.data || []);

    if (revs.length > 0) {
      const reviewIds = revs.map((r) => r.id);
      const [reactsRes, commsRes, likesRes, myLikeRes] = await Promise.all([
        supabase.from("review_reactions").select("*").in("review_id", reviewIds),
        supabase.from("review_comments").select("*").in("review_id", reviewIds).order("created_at", { ascending: true }),
        supabase.from("product_likes").select("*", { count: "exact", head: true }).eq("product_id", id),
        supabase.from("product_likes").select("id").eq("product_id", id).eq("user_id", viewerId).maybeSingle(),
      ]);

      const reactMap = {};
      (reactsRes.data || []).forEach((r) => {
        if (!reactMap[r.review_id]) reactMap[r.review_id] = [];
        reactMap[r.review_id].push(r);
      });
      setReviewReactions(reactMap);

      const commMap = {};
      (commsRes.data || []).forEach((c) => {
        if (!commMap[c.review_id]) commMap[c.review_id] = [];
        commMap[c.review_id].push(c);
      });
      setReviewComments(commMap);

      setLikeCount(likesRes.count || 0);
      setLiked(!!myLikeRes.data);
    } else {
      const [likesRes, myLikeRes] = await Promise.all([
        supabase.from("product_likes").select("*", { count: "exact", head: true }).eq("product_id", id),
        supabase.from("product_likes").select("id").eq("product_id", id).eq("user_id", viewerId).maybeSingle(),
      ]);
      setLikeCount(likesRes.count || 0);
      setLiked(!!myLikeRes.data);
    }

    setLoading(false);
  }

  const toggleProductLike = async () => {
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount((c) => (wasLiked ? Math.max(0, c - 1) : c + 1));

    if (!navigator.onLine) {
      enqueue({
        url: "/api/product-like",
        method: "POST",
        body: { product_id: id, user_id: viewerId, liked: !wasLiked },
        label: "Product like",
      });
      return;
    }

    try {
      await fetchWithRetry("/api/product-like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: id, user_id: viewerId, liked: !wasLiked }),
      });
    } catch {
      setLiked(wasLiked);
      setLikeCount((c) => (wasLiked ? c + 1 : Math.max(0, c - 1)));
    }
  };

  const toggleReviewReaction = async (reviewId, type) => {
    const existing = (reviewReactions[reviewId] || []).find(
      (r) => r.reaction_type === type && r.user_id === viewerId
    );

    if (existing) {
      setReviewReactions((prev) => ({
        ...prev,
        [reviewId]: (prev[reviewId] || []).filter(
          (r) => !(r.reaction_type === type && r.user_id === viewerId)
        ),
      }));
    } else {
      setReviewReactions((prev) => ({
        ...prev,
        [reviewId]: [...(prev[reviewId] || []), { id: `temp_${Date.now()}`, reaction_type: type, user_id: viewerId }],
      }));
    }

    if (!navigator.onLine) {
      enqueue({
        url: "/api/review-reaction",
        method: "POST",
        body: { review_id: reviewId, user_id: viewerId, reaction_type: type },
        label: "Review reaction",
      });
      return;
    }

    try {
      const res = await fetchWithRetry("/api/review-reaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ review_id: reviewId, user_id: viewerId, reaction_type: type }),
      });
      if (res.ok) {
        const inserted = await res.json();
        if (inserted && inserted.id) {
          setReviewReactions((prev) => ({
            ...prev,
            [reviewId]: (prev[reviewId] || []).map((r) =>
              r.id?.startsWith("temp_") ? inserted : r
            ),
          }));
        }
      }
    } catch {}
  };

  async function submitRating(e) {
    e.preventDefault();
    if (!userName.trim()) {
      setMessage("Please enter your name.");
      return;
    }

    if (!navigator.onLine) {
      enqueue({
        url: "/api/product-review",
        method: "POST",
        body: { product_id: id, user_name: userName, rating: userRating, comment: userComment },
        label: "Review",
      });
      setMessage("Saved. Your review will post when you're back online.");
      setUserName("");
      setUserRating(5);
      setUserComment("");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetchWithRetry("/api/product-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: id, user_name: userName, rating: userRating, comment: userComment }),
      });
      if (!res.ok) throw new Error("Submit failed");
      setMessage("Thank you for your review!");
      setUserName("");
      setUserRating(5);
      setUserComment("");
      fetchData();
    } catch {
      enqueue({
        url: "/api/product-review",
        method: "POST",
        body: { product_id: id, user_name: userName, rating: userRating, comment: userComment },
        label: "Review",
      });
      setMessage("Couldn't reach server. Review saved and will post automatically.");
      setUserName("");
      setUserRating(5);
      setUserComment("");
    }
    setSubmitting(false);
  }

  const submitReply = async (reviewId, parentId = null) => {
    const name = isAdmin && replyIsAdmin ? "OKMADE (Admin)" : replyName;
    if (!name.trim() || !replyMessage.trim()) {
      alert("Please enter your name and message.");
      return;
    }

    const messageText = replyMessage;
    setReplyMessage("");
    setReplyOpenFor(null);

    if (!navigator.onLine) {
      enqueue({
        url: "/api/review-comment",
        method: "POST",
        body: {
          review_id: reviewId,
          parent_id: parentId,
          author_name: name,
          is_admin: isAdmin && replyIsAdmin,
          message: messageText,
        },
        label: "Reply",
      });
      return;
    }

    try {
      const res = await fetchWithRetry("/api/review-comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          review_id: reviewId,
          parent_id: parentId,
          author_name: name,
          is_admin: isAdmin && replyIsAdmin,
          message: messageText,
        }),
      });
      if (res.ok) {
        const inserted = await res.json();
        setReviewComments((prev) => ({
          ...prev,
          [reviewId]: [...(prev[reviewId] || []), inserted],
        }));
      }
    } catch {
      enqueue({
        url: "/api/review-comment",
        method: "POST",
        body: {
          review_id: reviewId,
          parent_id: parentId,
          author_name: name,
          is_admin: isAdmin && replyIsAdmin,
          message: messageText,
        },
        label: "Reply",
      });
    }
  };

  const getWhatsAppLink = () => {
    const msg = `I'm interested in this product: ${product?.description} for ₦${product?.price}. See image: ${selectedImage || ""}`;
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
  };

  const productUrl =
    typeof window !== "undefined" ? window.location.href : "";

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto px-6 pt-24 pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg h-96 animate-pulse"></div>
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 animate-pulse"></div>
              <div className="h-40 bg-gray-100 dark:bg-gray-800 rounded animate-pulse mt-6"></div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Navbar />
        <div className="p-8 pt-24 text-center text-gray-800 dark:text-gray-200">
          Product not found.
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-6 pt-24 pb-12 bg-white dark:bg-gray-950">
        {lightboxOpen && selectedImage && (
          <div
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
            onClick={() => setLightboxOpen(false)}
          >
            <img src={selectedImage} className="max-w-full max-h-full object-contain" alt="Zoomed" />
            <button
              className="absolute top-4 right-4 text-white hover:text-amber-300 transition"
              onClick={() => setLightboxOpen(false)}
            >
              <CloseIcon className="w-8 h-8" />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <div
              className="bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden mb-4 cursor-pointer relative aspect-square"
              onClick={() => setLightboxOpen(true)}
            >
              {selectedImage && (
                <Image
                  src={selectedImage}
                  alt={product.description}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-contain"
                  placeholder="blur"
                  blurDataURL={BLUR}
                />
              )}
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img.image_url)}
                  className={`relative w-20 h-20 rounded cursor-pointer border-2 flex-shrink-0 overflow-hidden ${
                    selectedImage === img.image_url
                      ? "border-amber-500"
                      : "border-transparent hover:border-amber-300"
                  }`}
                >
                  <Image src={img.image_url} alt={`Thumbnail ${idx + 1}`} fill sizes="80px" className="object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-gray-100">
              {product.description}
            </h1>
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <StarRating rating={avgRating} />
              <span className="text-gray-600 dark:text-gray-400">
                ({ratings.length} reviews)
              </span>
              <button
                onClick={toggleProductLike}
                className={`flex items-center gap-1 px-3 py-1 rounded-full border text-sm transition ${
                  liked
                    ? "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-800 text-red-600 dark:text-red-400"
                    : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <HeartIcon filled={liked} className="w-4 h-4" />
                {likeCount}
              </button>
              <ShareMenu
                url={productUrl}
                title={product.description}
                text={`Check out this piece from OKMADE: ${product.description} — ₦${product.price}`}
                iconOnly
              />
            </div>
            <p className="text-3xl font-bold text-green-700 dark:text-green-400 mb-2">
              ₦{product.price}
            </p>
            {product.sold && (
              <span className="bg-red-600 text-white px-3 py-1 rounded-full inline-block mb-4">
                SOLD
              </span>
            )}
            <div className="flex gap-3 mb-6 flex-wrap">
              <a
                href={getWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-green-500 text-white px-6 py-2 rounded-full hover:bg-green-600 transition"
              >
                <WhatsAppIcon className="w-5 h-5" />
                WhatsApp Enquiry
              </a>
            </div>

            <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg mb-6">
              <h3 className="font-bold text-xl mb-3 text-gray-900 dark:text-gray-100">
                Leave a Review
              </h3>
              <form onSubmit={submitRating}>
                <input
                  type="text"
                  placeholder="Your name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-700 p-2 rounded mb-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  required
                />
                <div className="mb-2">
                  <span className="mr-2 text-gray-700 dark:text-gray-300">
                    Your rating:
                  </span>
                  <StarRating rating={userRating} interactive={true} onChange={setUserRating} />
                </div>
                <textarea
                  placeholder="Your review (optional)"
                  value={userComment}
                  onChange={(e) => setUserComment(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-700 p-2 rounded mb-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  rows="3"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition disabled:opacity-50"
                >
                  Submit Review
                </button>
                {message && (
                  <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{message}</p>
                )}
              </form>
            </div>

            <div>
              <h3 className="font-bold text-xl mb-3 text-gray-900 dark:text-gray-100">
                Customer Reviews
              </h3>
              {ratings.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">
                  No reviews yet. Be the first to review!
                </p>
              ) : (
                ratings.map((r) => {
                  const reacts = reviewReactions[r.id] || [];
                  const reactionCounts = reacts.reduce((acc, x) => {
                    acc[x.reaction_type] = (acc[x.reaction_type] || 0) + 1;
                    return acc;
                  }, {});
                  const comments = reviewComments[r.id] || [];
                  const topLevel = comments.filter((c) => !c.parent_id);

                  return (
                    <div
                      key={r.id}
                      className="border-b border-gray-200 dark:border-gray-800 py-4 last:border-0"
                    >
                      <div className="flex items-center gap-2">
                        <StarRating rating={r.rating} size="text-base" />
                        <span className="font-semibold text-gray-800 dark:text-gray-200">
                          {r.user_name}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(r.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {r.comment && (
                        <p className="text-gray-700 dark:text-gray-300 mt-2">
                          {r.comment}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-1 mt-3">
                        {REACTIONS.map(({ type, emoji }) => {
                          const count = reactionCounts[type] || 0;
                          const hasReacted = reacts.some(
                            (x) => x.reaction_type === type && x.user_id === viewerId
                          );
                          return (
                            <button
                              key={type}
                              onClick={() => toggleReviewReaction(r.id, type)}
                              className={`px-2 py-0.5 rounded-full border text-xs transition ${
                                hasReacted
                                  ? "bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700"
                                  : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
                              }`}
                            >
                              {emoji} {count > 0 && count}
                            </button>
                          );
                        })}
                        <button
                          onClick={() => {
                            setReplyOpenFor(r.id);
                            setReplyIsAdmin(isAdmin);
                            setReplyName(isAdmin ? "OKMADE (Admin)" : "");
                          }}
                          className="text-xs text-amber-600 dark:text-amber-400 hover:underline ml-2"
                        >
                          Reply
                        </button>
                      </div>

                      {topLevel.length > 0 && (
                        <div className="mt-3 space-y-2 pl-4 border-l-2 border-gray-100 dark:border-gray-800">
                          {topLevel.map((c) => (
                            <div
                              key={c.id}
                              className={`p-2 rounded ${
                                c.is_admin
                                  ? "bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
                                  : "bg-gray-50 dark:bg-gray-800"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                                  {c.author_name}
                                </span>
                                {c.is_admin && (
                                  <span className="text-xs bg-amber-200 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full">
                                    Admin
                                  </span>
                                )}
                                <span className="text-xs text-gray-400">
                                  {new Date(c.created_at).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                                {c.message}
                              </p>
                              {comments
                                .filter((x) => x.parent_id === c.id)
                                .map((reply) => (
                                  <div
                                    key={reply.id}
                                    className="ml-4 mt-2 pl-3 border-l border-gray-200 dark:border-gray-700"
                                  >
                                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                      {reply.author_name}
                                    </span>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                      {reply.message}
                                    </p>
                                  </div>
                                ))}
                            </div>
                          ))}
                        </div>
                      )}

                      {replyOpenFor === r.id && (
                        <div className="mt-3 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                          {!isAdmin && (
                            <input
                              type="text"
                              placeholder="Your name"
                              value={replyName}
                              onChange={(e) => setReplyName(e.target.value)}
                              className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded text-sm mb-2 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100"
                            />
                          )}
                          {isAdmin && (
                            <div className="flex items-center gap-2 mb-2 text-sm">
                              <label className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                                <input
                                  type="checkbox"
                                  checked={replyIsAdmin}
                                  onChange={(e) => setReplyIsAdmin(e.target.checked)}
                                />
                                Reply as Admin
                              </label>
                            </div>
                          )}
                          <textarea
                            placeholder="Write a reply..."
                            value={replyMessage}
                            onChange={(e) => setReplyMessage(e.target.value)}
                            className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded text-sm mb-2 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100"
                            rows="2"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => submitReply(r.id)}
                              className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 rounded text-sm"
                            >
                              Post Reply
                            </button>
                            <button
                              onClick={() => {
                                setReplyOpenFor(null);
                                setReplyMessage("");
                              }}
                              className="bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 px-3 py-1 rounded text-sm text-gray-800 dark:text-gray-200"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
              You May Also Like
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedProducts.map((rp) => (
                <div
                  key={rp.id}
                  className="bg-white dark:bg-gray-900 rounded-xl shadow-md overflow-hidden hover:shadow-xl transition cursor-pointer border border-gray-200 dark:border-gray-800"
                  onClick={() => router.push(`/product/${rp.id}`)}
                >
                  <div className="p-4">
                    <p className="text-gray-800 dark:text-gray-200 font-medium">
                      {rp.description}
                    </p>
                    <p className="text-green-700 dark:text-green-400 font-bold mt-2">
                      ₦{rp.price}
                    </p>
                    {rp.sold && (
                      <span className="text-red-600 dark:text-red-400 text-sm">Sold</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
