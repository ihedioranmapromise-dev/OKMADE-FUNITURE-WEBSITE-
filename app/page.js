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

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [latestCatalog, setLatestCatalog] = useState(null);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [testimonials, setTestimonials] = useState([]);
  const [loadingTestimonials, setLoadingTestimonials] = useState(true);
  const [token, setToken] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function fetchProducts() {
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
        setProducts(productsWithDetails);
      }
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
          .order("display_order");
        setLatestCatalog({ ...catalog, images: images || [] });
      }
      setLoadingCatalog(false);
    }
    async function fetchTestimonials() {
      const { data: killedTokens, error } = await supabase
        .from("tokens")
        .select("id, token_string, client_name, work_description, created_at")
        .eq("status", "killed")
        .order("created_at", { ascending: false })
        .limit(6);
      if (error || !killedTokens || killedTokens.length === 0) {
        setTestimonials([]);
        setLoadingTestimonials(false);
        return;
      }
      const testimonialsWithImages = await Promise.all(
        killedTokens.map(async (token) => {
          const { data: images } = await supabase
            .from("token_request_images")
            .select("image_url")
            .eq("token_id", token.id)
            .order("display_order")
            .limit(1);
          return { ...token, image: images && images.length ? images[0].image_url : null };
        })
      );
      setTestimonials(testimonialsWithImages);
      setLoadingTestimonials(false);
    }
    fetchProducts();
    fetchLatestCatalog();
    fetchTestimonials();
  }, []);

  const handleTokenSubmit = (e) => {
    e.preventDefault();
    if (token.trim()) router.push(`/workspace/${token.trim()}`);
  };

  const getWhatsAppLink = (product) => {
    const message = `I'm interested in this product: ${product.description} for ₦${product.price}.`;
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  };

  const getWhatsAppGeneralLink = () => {
    const message = "Hello, I have a question about your furniture.";
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div>
      <section className="relative text-white">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1589939705384-5185137a7f0f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')" }}>
          <div className="absolute inset-0 bg-black/50"></div>
        </div>
        <div className="relative container mx-auto px-6 py-32 text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-4">OKMADE Furniture</h1>
          <p className="text-xl md:text-2xl max-w-2xl mx-auto">Handcrafted pieces for modern living – timeless design, exceptional quality.</p>
          <div className="mt-8 flex gap-4 justify-center flex-wrap">
            <a href="/showroom" className="bg-white text-black px-6 py-3 rounded-full font-semibold hover:bg-gray-200 transition">Browse Showroom</a>
            <a href="/catalog" className="bg-transparent border-2 border-white px-6 py-3 rounded-full font-semibold hover:bg-white hover:text-black transition">View Catalog</a>
          </div>
        </div>
      </section>

      <section className="bg-gray-100 py-16">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Track Your Custom Work</h2>
          <p className="text-gray-600 mb-6">Enter the private token you received to see your workspace and progress.</p>
          <form onSubmit={handleTokenSubmit} className="max-w-md mx-auto flex gap-3">
            <input type="text" value={token} onChange={(e) => setToken(e.target.value)} placeholder="Your token (e.g., ABC-123)" className="flex-1 p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
            <button type="submit" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition">Track Work →</button>
          </form>
          <p className="text-sm text-gray-500 mt-4">Example tokens: ABC123, XYZ789 (check your email or SMS).</p>
        </div>
      </section>

      <section className="container mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Featured Pieces</h2>
        {loadingProducts ? (
          <p className="text-center text-gray-500">Loading products...</p>
        ) : products.length === 0 ? (
          <p className="text-center text-gray-500">No products yet. Check back soon!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.slice(0, 6).map((product) => (
              <div key={product.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition">
                <div className="relative h-64">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.description} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">No image</div>
                  )}
                  {product.sold && <span className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold">SOLD</span>}
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
        )}
        {products.length > 6 && (
          <div className="text-center mt-10">
            <a href="/showroom" className="inline-block bg-gray-800 text-white px-8 py-3 rounded-full hover:bg-gray-900 transition">View All Products →</a>
          </div>
        )}
      </section>

      <section className="bg-white py-16 border-t border-gray-200">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Latest Catalog Space</h2>
          {loadingCatalog ? (
            <p className="text-center text-gray-500">Loading catalog...</p>
          ) : latestCatalog ? (
            <div className="max-w-4xl mx-auto text-center">
              <p className="text-gray-700 text-lg font-semibold mb-2">{latestCatalog.title}</p>
              <p className="text-gray-700 text-lg mb-6">{latestCatalog.description}</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {latestCatalog.images.slice(0, 6).map((img, idx) => (
                  <div key={idx} className="relative">
                    <img src={img.image_url} className="w-full h-40 object-cover rounded-lg shadow" />
                    <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`I'm interested in this catalog item: ${latestCatalog.title}. Image: ${img.image_url}`)}`} target="_blank" rel="noopener noreferrer" className="absolute bottom-2 right-2 bg-green-500 text-white p-1 rounded-full text-xs hover:bg-green-600">📞</a>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <a href="/catalog" className="inline-block bg-purple-600 text-white px-8 py-3 rounded-full hover:bg-purple-700 transition">Explore Full Catalog →</a>
              </div>
            </div>
          ) : (
            <p className="text-center text-gray-500">No catalog spaces yet. Check back soon!</p>
          )}
        </div>
      </section>

      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Client Testimonials</h2>
          {loadingTestimonials ? (
            <p className="text-center text-gray-500">Loading testimonials...</p>
          ) : testimonials.length === 0 ? (
            <p className="text-center text-gray-500">No testimonials yet. Completed works will appear here.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {testimonials.map((testimonial) => (
                <a key={testimonial.id} href={`/workspace/${testimonial.token_string}`} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition block">
                  <div className="h-48 overflow-hidden">
                    {testimonial.image ? <img src={testimonial.image} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">No image</div>}
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-xl mb-2">{testimonial.client_name || "Client"}</h3>
                    <p className="text-gray-600 line-clamp-3">{testimonial.work_description || "Completed furniture piece. See the full story."}</p>
                    <p className="text-sm text-blue-500 mt-3">View full work →</p>
                  </div>
                </a>
              ))}
            </div>
          )}
          <div className="text-center mt-10">
            <a href="/testimonials" className="inline-block bg-gray-800 text-white px-8 py-3 rounded-full hover:bg-gray-900 transition">View All Testimonials →</a>
          </div>
        </div>
      </section>

      <a href={getWhatsAppGeneralLink()} target="_blank" rel="noopener noreferrer" className="fixed bottom-6 right-6 bg-green-500 text-white p-4 rounded-full shadow-lg hover:bg-green-600 transition z-50">💬 WhatsApp</a>
      <footer className="bg-gray-900 text-white text-center py-6 text-sm">
        <p>© 2026 OKMADE Furniture. All rights reserved.</p>
        <p className="mt-2"><a href="/admin/login" className="text-gray-400 hover:text-white transition">Admin Login</a></p>
      </footer>
    </div>
  );
  }
