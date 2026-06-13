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
            .order("display_order")
            .limit(1);
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
            imageUrl: images && images.length ? images[0].image_url : null,
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
    <div className="container mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold text-center mb-6">Full Showroom</h1>
      <div className="max-w-md mx-auto mb-8">
        <input
          type="text"
          placeholder="Search products by description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      {loading ? (
        <p className="text-center">Loading products...</p>
      ) : displayProducts.length === 0 ? (
        <p className="text-center">No products match your search.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayProducts.slice(0, visibleCount).map((product) => (
              <div key={product.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition">
                <div className="relative h-64">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.description} className="w-full h-full object-cover cursor-pointer" onClick={() => router.push(`/product/${product.id}`)} />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">No image</div>
                  )}
                  {product.sold && (
                    <span className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold">SOLD</span>
                  )}
                </div>
                <div className="p-5">
                  <p className="text-gray-600 text-sm mb-2">{product.description}</p>
                  <div className="flex justify-between items-center mt-1">
                    <StarRating rating={product.avgRating || 0} />
                    <span className="text-xs text-gray-500">({product.reviewCount || 0})</span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xl font-bold text-green-700">₦{product.price}</span>
                    <a href={getWhatsAppLink(product)} target="_blank" rel="noopener noreferrer" className="text-green-500 hover:text-green-600">📞 WhatsApp</a>
                  </div>
                  <button onClick={() => router.push(`/product/${product.id}`)} className="mt-3 w-full bg-gray-800 text-white py-1 rounded hover:bg-gray-900 transition text-sm">View Details</button>
                </div>
              </div>
            ))}
          </div>
          {visibleCount < displayProducts.length && (
            <div className="text-center mt-10">
              <button onClick={loadMore} className="bg-gray-800 text-white px-8 py-3 rounded-full hover:bg-gray-900 transition">Load More</button>
            </div>
          )}
        </>
      )}
    </div>
  );
            }
