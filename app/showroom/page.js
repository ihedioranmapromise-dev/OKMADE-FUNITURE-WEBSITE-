"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Navbar from "@/app/components/Navbar";
import SearchInput from "@/app/components/SearchInput";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "";
const BLUR = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxIDEiPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNmZWYzYzciLz48L3N2Zz4=";

function StarRating({ rating }) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <div className="flex items-center gap-0.5">
      {[...Array(full)].map((_, i) => <span key={i} className="text-yellow-500">★</span>)}
      {half && <span className="text-yellow-500">½</span>}
      {[...Array(empty)].map((_, i) => <span key={i} className="text-gray-300 dark:text-gray-600">★</span>)}
    </div>
  );
}

function ProductCard({ product, router, priority }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (product.images.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % product.images.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [product.images.length]);

  const getWhatsAppLink = (product) => {
    const message = `I'm interested in this product: ${product.description} for ₦${product.price}.`;
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  };

  const currentImg = product.images[currentImageIndex]?.image_url;

  return (
    <div className="group bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden border border-amber-100/30 dark:border-gray-800 hover:-translate-y-1">
      <div
        className="relative h-64 overflow-hidden bg-amber-50 dark:bg-gray-800 cursor-pointer"
        onClick={() => router.push(`/product/${product.id}`)}
      >
        {currentImg ? (
          <Image
            src={currentImg}
            alt={product.description}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition duration-500"
            placeholder="blur"
            blurDataURL={BLUR}
            priority={priority}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-amber-300 dark:text-gray-600 text-sm">No image</div>
        )}
        {product.sold && (
          <span className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold z-10">SOLD</span>
        )}
        {product.featured && (
          <span className="absolute top-4 left-4 bg-amber-600 text-white px-3 py-1 rounded-full text-xs font-bold z-10">★ FEATURED</span>
        )}
        {product.images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {product.images.map((_, idx) => (
              <span key={idx} className={`w-2 h-2 rounded-full transition ${idx === currentImageIndex ? "bg-white" : "bg-white/40"}`} />
            ))}
          </div>
        )}
      </div>
      <div className="p-5">
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-1 line-clamp-2">{product.description}</p>
        <div className="flex justify-between items-center mt-1">
          <StarRating rating={product.avgRating || 0} />
          <span className="text-xs text-gray-500 dark:text-gray-400">({product.reviewCount || 0})</span>
        </div>
        <div className="flex justify-between items-center mt-2">
          <span className="text-xl font-bold text-green-700 dark:text-green-400">₦{product.price}</span>
          <a href={getWhatsAppLink(product)} target="_blank" rel="noopener noreferrer" className="text-green-500 hover:text-green-600">📞 WhatsApp</a>
        </div>
        <button onClick={() => router.push(`/product/${product.id}`)} className="mt-3 w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 rounded-full transition">
          View Details
        </button>
      </div>
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
      const filtered = allProducts.filter((p) =>
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

    if (error || !productsData || productsData.length === 0) {
      setAllProducts([]);
      setDisplayProducts([]);
      setLoading(false);
      return;
    }

    const ids = productsData.map((p) => p.id);
    const [allImages, allRatings] = await Promise.all([
      supabase.from("product_images").select("product_id, image_url, display_order").in("product_id", ids).order("display_order", { ascending: true }),
      supabase.from("ratings").select("product_id, rating").in("product_id", ids),
    ]);

    const imagesByProduct = {};
    (allImages.data || []).forEach((img) => {
      if (!imagesByProduct[img.product_id]) imagesByProduct[img.product_id] = [];
      imagesByProduct[img.product_id].push(img);
    });

    const ratingsByProduct = {};
    (allRatings.data || []).forEach((r) => {
      if (!ratingsByProduct[r.product_id]) ratingsByProduct[r.product_id] = [];
      ratingsByProduct[r.product_id].push(r.rating);
    });

    const productsWithDetails = productsData.map((product) => {
      const imgs = imagesByProduct[product.id] || [];
      const rts = ratingsByProduct[product.id] || [];
      const avg = rts.length ? rts.reduce((a, b) => a + b, 0) / rts.length : 0;
      return { ...product, images: imgs, avgRating: avg, reviewCount: rts.length };
    });

    // Featured first
    productsWithDetails.sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return 0;
    });

    setAllProducts(productsWithDetails);
    setDisplayProducts(productsWithDetails);
    setLoading(false);
  }

  const loadMore = () => setVisibleCount((prev) => prev + 9);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-amber-900/90 via-amber-800/80 to-stone-800 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 pt-24 pb-12">
      <Navbar />
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} />
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-amber-400/20 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-orange-300/15 blur-3xl pointer-events-none"></div>

      <div className="relative z-10 container mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 tracking-tight">
            Our <span className="text-amber-300">Showroom</span>
          </h1>
          <p className="text-amber-100/80 max-w-xl mx-auto">
            Discover handcrafted furniture pieces, each with its own story.
          </p>
        </div>

        <div className="max-w-md mx-auto mb-10">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search products..."
            storageKey="okmade_recent_showroom"
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10">
                <div className="h-64 bg-white/5 animate-pulse"></div>
                <div className="p-5 space-y-2">
                  <div className="h-4 bg-white/10 rounded w-3/4 animate-pulse"></div>
                  <div className="h-4 bg-white/10 rounded w-1/2 animate-pulse"></div>
                  <div className="h-8 bg-white/5 rounded animate-pulse mt-3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : displayProducts.length === 0 ? (
          <div className="text-center py-16 text-gray-400">No products match your search.</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {displayProducts.slice(0, visibleCount).map((product, idx) => (
                <ProductCard key={product.id} product={product} router={router} priority={idx < 3} />
              ))}
            </div>
            {visibleCount < displayProducts.length && (
              <div className="text-center mt-14">
                <button onClick={loadMore} className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white border border-white/20 px-8 py-3 rounded-full transition shadow-lg hover:shadow-xl">
                  Load More
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
