"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "";

export default function ShowroomPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      // 1. Get all products
      const { data: productsData, error } = await supabase
        .from("showroom")
        .select("*")
        .order("created_at", { ascending: false });
      if (error || !productsData) {
        setLoading(false);
        return;
      }
      // 2. For each product, fetch its first image from product_images
      const productsWithImages = await Promise.all(
        productsData.map(async (product) => {
          const { data: images } = await supabase
            .from("product_images")
            .select("image_url")
            .eq("product_id", product.id)
            .order("display_order", { ascending: true })
            .limit(1);
          return {
            ...product,
            imageUrl: images && images.length > 0 ? images[0].image_url : null,
          };
        })
      );
      setProducts(productsWithImages);
      setLoading(false);
    }
    fetchProducts();
  }, []);

  const getWhatsAppLink = (product) => {
    const message = `I'm interested in this product: ${product.description} for ₦${product.price}.`;
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="container mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold text-center mb-10">Full Showroom</h1>
      {loading ? (
        <p className="text-center">Loading products...</p>
      ) : products.length === 0 ? (
        <p className="text-center">No products yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition">
              <div className="relative h-64">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.description} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">No image</div>
                )}
                {product.sold && (
                  <span className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold">SOLD</span>
                )}
              </div>
              <div className="p-5">
                <p className="text-gray-600 text-sm mb-2">{product.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-green-700">₦{product.price}</span>
                  <a href={getWhatsAppLink(product)} target="_blank" rel="noopener noreferrer" className="text-green-500 hover:text-green-600">📞 WhatsApp</a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
        }
