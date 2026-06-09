"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [latestCatalog, setLatestCatalog] = useState(null);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [token, setToken] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function fetchProducts() {
      const { data, error } = await supabase
        .from("showroom")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error) setProducts(data);
      setLoadingProducts(false);
    }
    async function fetchLatestCatalog() {
      const { data: catalog, error: catError } = await supabase
        .from("catalogs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      if (!catError && catalog) {
        const { data: images } = await supabase
          .from("catalog_images")
          .select("image_url")
          .eq("catalog_id", catalog.id)
          .order("display_order", { ascending: true });
        setLatestCatalog({ ...catalog, images: images || [] });
      }
      setLoadingCatalog(false);
    }
    fetchProducts();
    fetchLatestCatalog();
  }, []);

  const handleTokenSubmit = (e) => {
    e.preventDefault();
    if (token.trim()) {
      router.push(`/workspace/${token.trim()}`);
    }
  };

  const getWhatsAppLink = (product) => {
    const message = `I'm interested in this product: ${product.description} for $${product.price}. See image: ${product.image_url}`;
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  };

  const getWhatsAppGeneralLink = () => {
    const message = "Hello, I have a question about your furniture.";
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div>
      {/* Hero Section – Carpentry Workshop Background */}
      <section className="relative text-white">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1589939705384-5185137a7f0f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')",
          }}
        >
          <div className="absolute inset-0 bg-black/50"></div>
        </div>
        <div className="relative container mx-auto px-6 py-32 text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-4">OKMADE Furniture</h1>
          <p className="text-xl md:text-2xl max-w-2xl mx-auto">
            Handcrafted pieces for modern living – timeless design, exceptional quality.
          </p>
          <div className="mt-8 flex gap-4 justify-center flex-wrap">
            <a
              href="/showroom"
              className="bg-white text-black px-6 py-3 rounded-full font-semibold hover:bg-gray-200 transition"
            >
              Browse Showroom
            </a>
            <a
              href="/catalog"
              className="bg-transparent border-2 border-white px-6 py-3 rounded-full font-semibold hover:bg-white hover:text-black transition"
            >
              View Catalog
            </a>
          </div>
        </div>
      </section>

      {/* Token Workspace Section */}
      <section className="bg-gray-100 py-16">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Track Your Custom Work</h2>
          <p className="text-gray-600 mb-6">
            Enter the private token you received to see your workspace and progress.
          </p>
          <form onSubmit={handleTokenSubmit} className="max-w-md mx-auto flex gap-3">
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Your token (e.g., ABC-123)"
              className="flex-1 p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
            >
              Track Work →
            </button>
          </form>
          <p className="text-sm text-gray-500 mt-4">
            Example tokens: ABC123, XYZ789 (check your email or SMS).
          </p>
        </div>
      </section>

      {/* Featured Showroom Products */}
      <section className="container mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Featured Pieces</h2>
        {loadingProducts ? (
          <p className="text-center text-gray-500">Loading products...</p>
        ) : products.length === 0 ? (
          <p className="text-center text-gray-500">No products yet. Check back soon!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.slice(0, 6).map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition"
              >
                <div className="relative h-64">
                  <img
                    src={product.image_url}
                    alt={product.description}
                    className="w-full h-full object-cover"
                  />
                  {product.sold && (
                    <span className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                      SOLD
                    </span>
                  )}
                </div>
                <div className="p-5">
                  <p className="text-gray-600 text-sm mb-2">{product.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-green-700">
                      ${product.price}
                    </span>
                    <a
                      href={getWhatsAppLink(product)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-500 hover:text-green-600"
                    >
                      📞 WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {products.length > 6 && (
          <div className="text-center mt-10">
            <a
              href="/showroom"
              className="inline-block bg-gray-800 text-white px-8 py-3 rounded-full hover:bg-gray-900 transition"
            >
              View All Products →
            </a>
          </div>
        )}
      </section>

      {/* Latest Catalog Space Preview */}
      <section className="bg-white py-16 border-t border-gray-200">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Latest Catalog Space</h2>
          {loadingCatalog ? (
            <p className="text-center text-gray-500">Loading catalog...</p>
          ) : latestCatalog ? (
            <div className="max-w-4xl mx-auto text-center">
              <p className="text-gray-700 text-lg mb-6">{latestCatalog.description}</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {latestCatalog.images.slice(0, 6).map((img, idx) => (
                  <div key={idx} className="relative">
                    <img
                      src={img.image_url}
                      className="w-full h-40 object-cover rounded-lg shadow"
                    />
                    <a
                      href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
                        `I'm interested in this catalog item: ${latestCatalog.description}. Image: ${img.image_url}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute bottom-2 right-2 bg-green-500 text-white p-1 rounded-full text-xs hover:bg-green-600"
                    >
                      📞
                    </a>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <a
                  href="/catalog"
                  className="inline-block bg-purple-600 text-white px-8 py-3 rounded-full hover:bg-purple-700 transition"
                >
                  Explore Full Catalog →
                </a>
              </div>
            </div>
          ) : (
            <p className="text-center text-gray-500">No catalog spaces yet. Check back soon!</p>
          )}
        </div>
      </section>

      {/* Floating WhatsApp Icon */}
      <a
        href={getWhatsAppGeneralLink()}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 bg-green-500 text-white p-4 rounded-full shadow-lg hover:bg-green-600 transition z-50"
      >
        💬 WhatsApp
      </a>

      {/* Footer with admin link */}
      <footer className="bg-gray-900 text-white text-center py-6 text-sm">
        <p>© 2026 OKMADE Furniture. All rights reserved.</p>
        <p className="mt-2">
          <a href="/admin/login" className="text-gray-400 hover:text-white transition">
            Admin Login
          </a>
        </p>
      </footer>
    </div>
  );
                }
