"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "";

function StarRating({ rating }) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <div className="flex items-center gap-0.5">
      {[...Array(full)].map((_, i) => <span key={i} className="text-yellow-500">★</span>)}
      {half && <span className="text-yellow-500">½</span>}
      {[...Array(empty)].map((_, i) => <span key={i} className="text-gray-300">★</span>)}
    </div>
  );
}

export default function ShowroomPage() {
  const [allProducts, setAllProducts] = useState([]);
  const [displayProducts, setDisplayProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [visibleCount, setVisibleCount] = useState(9);
  const router = useRouter();

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setDisplayProducts(allProducts);
    } else {
      const filtered = allProducts.filter(p =>
        p.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setDisplayProducts(filtered);
    }
    setVisibleCount(9);
  }, [searchTerm, allProducts]);

  async function fetchProducts() {
    setLoading(true);
    const { data: productsData, error } = await supabase
      .from("showroom")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && productsData) {
      const productsWithDetails = await Promise.all(
        productsData.map(async (product) => {
          const { data: images } = await supabase
            .from("product_images")
            .select("image_url")
            .eq("product_id", product.id)
            .order("display_order");
          const { data: ratings } = await supabase
            .from("ratings")
            .select("rating")
            .eq("product_id", product.id);
          let avgRating = 0;
          if (ratings && ratings.length) {
            const sum = ratings.reduce((a, b) => a + b.rating, 0);
            avgRating = sum / ratings.length;
          }
          return {
            ...product,
            images: images || [],
            avgRating,
            reviewCount: ratings ? ratings.length : 0,
          };
        })
      );
      setAllProducts(productsWithDetails);
      setDisplayProducts(productsWithDetails);
    }
    setLoading(false);
  }

  const loadMore = () => setVisibleCount(prev => prev + 9);

  const getWhatsAppLink = (product) => {
    const message = `I'm interested in this product: ${product.description} for ₦${product.price}.`;
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  };

  return (
    // --- NEW WRAPPER WITH ELITE BACKGROUND ---
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-amber-100/60 via-orange-50/30 to-white py-12">
      
      {/* Floating Glow Orbs (Background Decoration) */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-amber-200/30 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-orange-200/20 blur-3xl pointer-events-none"></div>

      {/* Subtle Dotted Pattern Overlay */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #d97706 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

      {/* Main Content - Positioned above the background */}
      <div className="relative z-10 container mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-3 tracking-tight">
            Our <span className="text-amber-700">Showroom</span>
          </h1>
          <p className="text-gray-600 max-w-xl mx-auto">Discover handcrafted furniture pieces, each with its own story.</p>
        </div>

        <div className="max-w-md mx-auto mb-10">
          <div className="relative">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-4 pl-12 border border-amber-200/50 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-300 bg-white/80 backdrop-blur-sm transition"
            />
            <svg className="absolute left-4 top-4 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-pulse text-amber-600">Loading beautiful pieces...</div>
          </div>
        ) : displayProducts.length === 0 ? (
          <div className="text-center py-16 text-gray-400">No products match your search.</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {displayProducts.slice(0, visibleCount).map((product) => {
                const [currentImageIndex, setCurrentImageIndex] = useState(0);
                useEffect(() => {
                  if (product.images.length > 1) {
                    const interval = setInterval(() => {
                      setCurrentImageIndex(prev => (prev + 1) % product.images.length);
                    }, 3000);
                    return () => clearInterval(interval);
                  }
                }, [product.images.length]);
                return (
                  <div
                    key={product.id}
                    className="group bg-white/90 backdrop-blur-sm rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden border border-amber-100/30 hover:-translate-y-1"
                  >
                    <div className="relative h-64 overflow-hidden bg-amber-50 cursor-pointer" onClick={() => router.push(`/product/${product.id}`)}>
                      {product.images.length > 0 ? (
                        <img
                          src={product.images[currentImageIndex]?.image_url}
                          alt={product.description}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-amber-300 text-sm">No image</div>
                      )}
                      {product.sold && (
                        <span className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold">SOLD</span>
                      )}
                      {product.images.length > 1 && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                          {product.images.map((_, idx) => (
                            <span
                              key={idx}
                              className={`w-2 h-2 rounded-full transition ${idx === currentImageIndex ? 'bg-white' : 'bg-white/40'}`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <p className="text-gray-600 text-sm mb-1 line-clamp-2">{product.description}</p>
                      <div className="flex justify-between items-center mt-1">
                        <StarRating rating={product.avgRating || 0} />
                        <span className="text-xs text-gray-500">({product.reviewCount || 0})</span>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xl font-bold text-green-700">₦{product.price}</span>
                        <a href={getWhatsAppLink(product)} target="_blank" rel="noopener noreferrer" className="text-green-500 hover:text-green-600">📞 WhatsApp</a>
                      </div>
                      <button onClick={() => router.push(`/product/${product.id}`)} className="mt-3 w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 rounded-full transition">
                        View Details
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            {visibleCount < displayProducts.length && (
              <div className="text-center mt-14">
                <button onClick={loadMore} className="bg-white hover:bg-amber-50 text-amber-700 border border-amber-200 px-8 py-3 rounded-full transition shadow-sm hover:shadow-md">Load More</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
