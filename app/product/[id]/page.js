"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useParams, useRouter } from "next/navigation";
import { getOptimizedImage } from "@/lib/utils";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "";

// Icons
const HeartIcon = ({ filled, className = "w-5 h-5" }) => (
  <svg
    className={className}
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    viewBox="0 0 24 24"
    strokeWidth="2"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
    />
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
          className={`${size} ${
            interactive ? "cursor-pointer" : "cursor-default"
          } ${star <= display ? "text-yellow-500" : "text-gray-300"}`}
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
    id = crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).substring(2, 15);
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

  // Likes
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  // Reactions per review (map review_id -> array of {reaction_type, user_id})
  const [reviewReactions, setReviewReactions] = useState({});
  // Comments per review (map review_id -> array)
  const [reviewComments, setReviewComments] = useState({});
  // Reply state per review
  const [replyOpenFor, setReplyOpenFor] = useState(null);
  const [replyName, setReplyName] = useState("");
  const [replyMessage, setReplyMessage] = useState("");
  const [replyIsAdmin, setReplyIsAdmin] = useState(false);

  const viewerId = getViewerId();
  const isAdmin =
    typeof window !== "undefined" &&
    sessionStorage.getItem("adminAuth") === "true";

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  async function fetchData() {
    // Product
    const { data: prod, error } = await supabase
      .from("showroom")
      .select("*")
      .eq("id", id)
      .single();
    if (error) return;
    setProduct(prod);

    // Images
    const { data: imgs } = await supabase
      .from("product_images")
      .select("image_url")
      .eq("product_id", id)
      .order("display_order");
    setImages(imgs || []);
    if (imgs && imgs.length) setSelectedImage(imgs[0].image_url);

    // Ratings
    const { data: revs } = await supabase
      .from("ratings")
      .select("*")
      .eq("product_id", id)
      .order("created_at", { ascending: false });
    setRatings(revs || []);
    if (revs && revs.length) {
      const sum = revs.reduce((a, b) => a + b.rating, 0);
      setAvgRating(sum / revs.length);
    }

    // Likes count
    const { count: likes } = await supabase
      .from("product_likes")
      .select("*", { count: "exact", head: true })
      .eq("product_id", id);
    setLikeCount(likes || 0);
    const { data: myLike } = await supabase
      .from("product_likes")
      .select("id")
      .eq("product_id", id)
      .eq("user_id", viewerId)
      .single();
    setLiked(!!myLike);

    // Reactions for all reviews
    if (revs && revs.length) {
      const reviewIds = revs.map((r) => r.id);
      const { data: reacts } = await supabase
        .from("review_reactions")
        .select("*")
        .in("review_id", reviewIds);
      const reactMap = {};
      (reacts || []).forEach((r) => {
        if (!reactMap[r.review_id]) reactMap[r.review_id] = [];
        reactMap[r.review_id].push(r);
      });
      setReviewReactions(reactMap);

      // Comments for all reviews
      const { data: comms } = await supabase
        .from("review_comments")
        .select("*")
        .in("review_id", reviewIds)
        .order("created_at", { ascending: true });
      const commMap = {};
      (comms || []).forEach((c) => {
        if (!commMap[c.review_id]) commMap[c.review_id] = [];
        commMap[c.review_id].push(c);
      });
      setReviewComments(commMap);
    }

    // Related products
    const { data: related } = await supabase
      .from("showroom")
      .select("id, description, price, sold")
      .neq("id", id)
      .limit(3);
    setRelatedProducts(related || []);
  }

  // Toggle product like
  const toggleProductLike = async () => {
    if (liked) {
      await supabase
        .from("product_likes")
        .delete()
        .eq("product_id", id)
        .eq("user_id", viewerId);
      setLiked(false);
      setLikeCount((c) => Math.max(0, c - 1));
    } else {
      await supabase
        .from("product_likes")
        .insert({ product_id: id, user_id: viewerId });
      setLiked(true);
      setLikeCount((c) => c + 1);
    }
  };

  // Toggle reaction on a review
  const toggleReviewReaction = async (reviewId, type) => {
    const existing = (reviewReactions[reviewId] || []).find(
      (r) => r.reaction_type === type && r.user_id === viewerId
    );
    if (existing) {
      await supabase
        .from("review_reactions")
        .delete()
        .eq("id", existing.id);
      setReviewReactions((prev) => ({
        ...prev,
        [reviewId]: (prev[reviewId] || []).filter(
          (r) =>
            !(r.reaction_type === type && r.user_id === viewerId)
        ),
      }));
    } else {
      const { data: inserted } = await supabase
        .from("review_reactions")
        .insert({
          review_id: reviewId,
          user_id: viewerId,
          reaction_type: type,
        })
        .select()
        .single();
      setReviewReactions((prev) => ({
        ...prev,
        [reviewId]: [...(prev[reviewId] || []), inserted],
      }));
    }
  };

  // Submit review
  async function submitRating(e) {
    e.preventDefault();
    if (!userName.trim()) {
      setMessage("Please enter your name.");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("ratings").insert([
      {
        product_id: id,
        user_name: userName,
        rating: userRating,
        comment: userComment,
      },
    ]);
    if (error) setMessage("Error: " + error.message);
    else {
      setMessage("Thank you for your review!");
      setUserName("");
      setUserRating(5);
      setUserComment("");
      fetchData();
    }
    setSubmitting(false);
  }

  // Submit reply to a review
  const submitReply = async (reviewId, parentId = null) => {
    const name = isAdmin && replyIsAdmin ? "OKMADE (Admin)" : replyName;
    if (!name.trim() || !replyMessage.trim()) {
      alert("Please enter your name and message.");
      return;
    }
    const { data: inserted, error } = await supabase
      .from("review_comments")
      .insert({
        review_id: reviewId,
        parent_id: parentId,
        author_name: name,
        is_admin: isAdmin && replyIsAdmin,
        message: replyMessage,
      })
      .select()
      .single();
    if (error) {
      alert("Error: " + error.message);
      return;
    }
    setReviewComments((prev) => ({
      ...prev,
      [reviewId]: [...(prev[reviewId] || []), inserted],
    }));
    setReplyMessage("");
    setReplyOpenFor(null);
  };

  const getWhatsAppLink = () => {
    const msg = `I'm interested in this product: ${product?.description} for ₦${product?.price}. See image: ${selectedImage || ""}`;
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
  };

  if (!product)
    return <div className="p-8 text-center">Loading product...</div>;

  return (
    <div className="container mx-auto px-6 py-12">
      {/* Lightbox */}
      {lightboxOpen && selectedImage && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}
        >
          <img
            src={selectedImage}
            className="max-w-full max-h-full object-contain"
            alt="Zoomed"
          />
          <button
            className="absolute top-4 right-4 text-white text-3xl"
            onClick={() => setLightboxOpen(false)}
          >
            ✕
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Images */}
        <div>
          <div
            className="bg-gray-100 rounded-lg overflow-hidden mb-4 cursor-pointer"
            onClick={() => setLightboxOpen(true)}
          >
            <img
              src={selectedImage}
              className="w-full h-auto object-contain max-h-96"
              alt={product.description}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {images.map((img, idx) => (
              <img
                key={idx}
                src={img.image_url}
                className="w-20 h-20 object-cover rounded cursor-pointer border-2 border-transparent hover:border-blue-500"
                onClick={() => setSelectedImage(img.image_url)}
                alt={`Thumbnail ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Details */}
        <div>
          <h1 className="text-3xl font-bold mb-2">{product.description}</h1>
          <div className="flex items-center gap-3 mb-4">
            <StarRating rating={avgRating} />
            <span className="text-gray-600">
              ({ratings.length} reviews)
            </span>
            <button
              onClick={toggleProductLike}
              className={`flex items-center gap-1 ml-3 px-3 py-1 rounded-full border text-sm transition ${
                liked
                  ? "bg-red-50 border-red-300 text-red-600"
                  : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
              }`}
            >
              <HeartIcon filled={liked} className="w-4 h-4" />
              {likeCount}
            </button>
          </div>
          <p className="text-3xl font-bold text-green-700 mb-2">
            ₦{product.price}
          </p>
          {product.sold && (
            <span className="bg-red-600 text-white px-3 py-1 rounded-full inline-block mb-4">
              SOLD
            </span>
          )}
          <div className="flex gap-3 mb-6">
            <a
              href={getWhatsAppLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-500 text-white px-6 py-2 rounded-full hover:bg-green-600 transition"
            >
              📞 WhatsApp Enquiry
            </a>
          </div>

          {/* Review Form */}
          <div className="bg-gray-100 p-4 rounded-lg mb-6">
            <h3 className="font-bold text-xl mb-3">Leave a Review</h3>
            <form onSubmit={submitRating}>
              <input
                type="text"
                placeholder="Your name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full border p-2 rounded mb-2"
                required
              />
              <div className="mb-2">
                <span className="mr-2">Your rating:</span>
                <StarRating
                  rating={userRating}
                  interactive={true}
                  onChange={setUserRating}
                />
              </div>
              <textarea
                placeholder="Your review (optional)"
                value={userComment}
                onChange={(e) => setUserComment(e.target.value)}
                className="w-full border p-2 rounded mb-2"
                rows="3"
              />
              <button
                type="submit"
                disabled={submitting}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition disabled:opacity-50"
              >
                Submit Review
              </button>
              {message && <p className="mt-2 text-sm">{message}</p>}
            </form>
          </div>

          {/* Reviews List */}
          <div>
            <h3 className="font-bold text-xl mb-3">Customer Reviews</h3>
            {ratings.length === 0 ? (
              <p className="text-gray-500">
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
                    className="border-b py-4 last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <StarRating rating={r.rating} size="text-base" />
                      <span className="font-semibold">{r.user_name}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(r.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {r.comment && (
                      <p className="text-gray-700 mt-2">{r.comment}</p>
                    )}

                    {/* Reactions */}
                    <div className="flex flex-wrap gap-1 mt-3">
                      {REACTIONS.map(({ type, emoji }) => {
                        const count = reactionCounts[type] || 0;
                        const hasReacted = reacts.some(
                          (x) =>
                            x.reaction_type === type &&
                            x.user_id === viewerId
                        );
                        return (
                          <button
                            key={type}
                            onClick={() =>
                              toggleReviewReaction(r.id, type)
                            }
                            className={`px-2 py-0.5 rounded-full border text-xs transition ${
                              hasReacted
                                ? "bg-amber-100 border-amber-300"
                                : "bg-gray-50 border-gray-200 hover:bg-gray-100"
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
                        className="text-xs text-amber-600 hover:underline ml-2"
                      >
                        Reply
                      </button>
                    </div>

                    {/* Replies list */}
                    {topLevel.length > 0 && (
                      <div className="mt-3 space-y-2 pl-4 border-l-2 border-gray-100">
                        {topLevel.map((c) => (
                          <div
                            key={c.id}
                            className={`p-2 rounded ${
                              c.is_admin
                                ? "bg-amber-50 border border-amber-200"
                                : "bg-gray-50"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold">
                                {c.author_name}
                              </span>
                              {c.is_admin && (
                                <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full">
                                  Admin
                                </span>
                              )}
                              <span className="text-xs text-gray-400">
                                {new Date(c.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 mt-1">
                              {c.message}
                            </p>

                            {/* Nested replies */}
                            {comments
                              .filter((x) => x.parent_id === c.id)
                              .map((reply) => (
                                <div
                                  key={reply.id}
                                  className="ml-4 mt-2 pl-3 border-l border-gray-200"
                                >
                                  <span className="text-xs font-semibold">
                                    {reply.author_name}
                                  </span>
                                  <p className="text-xs text-gray-600 mt-1">
                                    {reply.message}
                                  </p>
                                </div>
                              ))}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Reply form */}
                    {replyOpenFor === r.id && (
                      <div className="mt-3 bg-gray-50 p-3 rounded-lg">
                        {!isAdmin && (
                          <input
                            type="text"
                            placeholder="Your name"
                            value={replyName}
                            onChange={(e) => setReplyName(e.target.value)}
                            className="w-full p-2 border rounded text-sm mb-2"
                          />
                        )}
                        {isAdmin && (
                          <div className="flex items-center gap-2 mb-2 text-sm">
                            <label className="flex items-center gap-1">
                              <input
                                type="checkbox"
                                checked={replyIsAdmin}
                                onChange={(e) =>
                                  setReplyIsAdmin(e.target.checked)
                                }
                              />
                              Reply as Admin
                            </label>
                          </div>
                        )}
                        <textarea
                          placeholder="Write a reply..."
                          value={replyMessage}
                          onChange={(e) =>
                            setReplyMessage(e.target.value)
                          }
                          className="w-full p-2 border rounded text-sm mb-2"
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
                            className="bg-gray-300 hover:bg-gray-400 px-3 py-1 rounded text-sm"
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

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-6">You May Also Like</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedProducts.map((rp) => (
              <div
                key={rp.id}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition cursor-pointer"
                onClick={() => router.push(`/product/${rp.id}`)}
              >
                <div className="p-4">
                  <p className="text-gray-800 font-medium">
                    {rp.description}
                  </p>
                  <p className="text-green-700 font-bold mt-2">
                    ₦{rp.price}
                  </p>
                  {rp.sold && (
                    <span className="text-red-600 text-sm">Sold</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
