"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useParams, useRouter } from "next/navigation";

const supabase = createClient(
import { getOptimizedImage } from '@/lib/utils';
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "";

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
          className={`${size} ${interactive ? 'cursor-pointer' : 'cursor-default'} ${star <= display ? 'text-yellow-500' : 'text-gray-300'}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

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

    // Related products (simple: exclude current, limit 3)
    const { data: related } = await supabase
      .from("showroom")
      .select("id, description, price, sold")
      .neq("id", id)
      .limit(3);
    setRelatedProducts(related || []);
  }

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
      fetchData(); // refresh ratings
    }
    setSubmitting(false);
  }

  const getWhatsAppLink = () => {
    const msg = `I'm interested in this product: ${product?.description} for ₦${product?.price}. See image: ${selectedImage || ""}`;
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
  };

  if (!product) return <div className="p-8 text-center">Loading product...</div>;

  return (
    <div className="container mx-auto px-6 py-12">
      {/* Lightbox modal */}
      {lightboxOpen && selectedImage && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center" onClick={() => setLightboxOpen(false)}>
          <img src={getOptimizedImage(selectedImage, 800)} className="max-w-full max-h-full object-contain" />
          <button className="absolute top-4 right-4 text-white text-3xl" onClick={() => setLightboxOpen(false)}>✕</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Images */}
        <div>
          <div className="bg-gray-100 rounded-lg overflow-hidden mb-4 cursor-pointer" onClick={() => setLightboxOpen(true)}>
            <img src={getOptimizedImage(selectedImage, 800)} className="w-full h-auto object-contain max-h-96" />
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {images.map((img, idx) => (
              <img key={idx} src={getOptimizedImage(img.image_url, 120)} className="w-20 h-20 object-cover rounded cursor-pointer border-2 border-transparent hover:border-blue-500" onClick={() => setSelectedImage(img.image_url)} />
            ))}
          </div>
        </div>

        {/* Right: Details */}
        <div>
          <h1 className="text-3xl font-bold mb-2">{product.description}</h1>
          <div className="flex items-center gap-2 mb-4">
            <StarRating rating={avgRating} />
            <span className="text-gray-600">({ratings.length} reviews)</span>
          </div>
          <p className="text-3xl font-bold text-green-700 mb-2">₦{product.price}</p>
          {product.sold && <span className="bg-red-600 text-white px-3 py-1 rounded-full inline-block mb-4">SOLD</span>}
          <div className="flex gap-3 mb-6">
            <a href={getWhatsAppLink()} target="_blank" rel="noopener noreferrer" className="bg-green-500 text-white px-6 py-2 rounded-full hover:bg-green-600 transition">📞 WhatsApp Enquiry</a>
          </div>

          {/* Review Form */}
          <div className="bg-gray-100 p-4 rounded-lg mb-6">
            <h3 className="font-bold text-xl mb-3">Leave a Review</h3>
            <form onSubmit={submitRating}>
              <input type="text" placeholder="Your name" value={userName} onChange={e => setUserName(e.target.value)} className="w-full border p-2 rounded mb-2" required />
              <div className="mb-2">
                <span className="mr-2">Your rating:</span>
                <StarRating rating={userRating} interactive={true} onChange={setUserRating} />
              </div>
              <textarea placeholder="Your review (optional)" value={userComment} onChange={e => setUserComment(e.target.value)} className="w-full border p-2 rounded mb-2" rows="3" />
              <button type="submit" disabled={submitting} className="bg-blue-600 text-white px-4 py-2 rounded">Submit Review</button>
              {message && <p className="mt-2 text-sm">{message}</p>}
            </form>
          </div>

          {/* Customer Reviews */}
          <div>
            <h3 className="font-bold text-xl mb-3">Customer Reviews</h3>
            {ratings.length === 0 ? (
              <p className="text-gray-500">No reviews yet. Be the first to review!</p>
            ) : (
              ratings.map(r => (
                <div key={r.id} className="border-b py-3">
                  <div className="flex items-center gap-2">
                    <StarRating rating={r.rating} />
                    <span className="font-semibold">{r.user_name}</span>
                    <span className="text-xs text-gray-500">{new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                  {r.comment && <p className="text-gray-700 mt-1">{r.comment}</p>}
                </div>
              ))
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
              <div key={rp.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition cursor-pointer" onClick={() => router.push(`/product/${rp.id}`)}>
                <div className="p-4">
                  <p className="text-gray-800 font-medium">{rp.description}</p>
                  <p className="text-green-700 font-bold mt-2">₦{rp.price}</p>
                  {rp.sold && <span className="text-red-600 text-sm">Sold</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
