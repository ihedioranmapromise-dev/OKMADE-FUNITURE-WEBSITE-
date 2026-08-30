"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { getOptimizedImage } from "@/lib/utils";

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
  const [catalogImages, setCatalogImages] = useState([]);
  const [catalogGroups, setCatalogGroups] = useState([]);
  const [catalogGroupIndex, setCatalogGroupIndex] = useState(0);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [testimonials, setTestimonials] = useState([]);
  const [loadingTestimonials, setLoadingTestimonials] = useState(true);
  const [recentReviews, setRecentReviews] = useState([]);
  const [token, setToken] = useState("");
  const [imageIndices, setImageIndices] = useState({});
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [clientId, setClientId] = useState(null);
  const router = useRouter();

  const aboutImages = [
    "https://images.unsplash.com/photo-1616137466211-f939a420be84?w=1600&q=80",
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1600&q=80",
    "https://images.unsplash.com/photo-1591134523895-0b7e0f57a2f0?w=1600&q=80",
    "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1600&q=80",
    "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&q=80",
    "https://images.unsplash.com/photo-1575995872537-3793eb2b26d5?w=1600&q=80",
    "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=1600&q=80",
    "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=1600&q=80",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&q=80",
    "https://images.unsplash.com/photo-1511578314322-379afb476865?w=1600&q=80"
  ];
  const [aboutImageIndex, setAboutImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setAboutImageIndex(prev => (prev + 1) % aboutImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (catalogGroups.length === 0) return;
    const interval = setInterval(() => {
      setCatalogGroupIndex(prev => (prev + 1) % catalogGroups.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [catalogGroups]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setClientId(sessionStorage.getItem("clientId"));
    }
  }, []);

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
        setProducts(productsWithDetails);
        const initialIndices = {};
        productsWithDetails.forEach(p => { initialIndices[p.id] = 0; });
        setImageIndices(initialIndices);
      }
      setLoadingProducts(false);
    }

    async function fetchAllCatalogImages() {
      setLoadingCatalog(true);
      const { data: catalogs, error } = await supabase
        .from("catalogs")
        .select("id")
        .order("created_at", { ascending: false });
      if (error || !catalogs) {
        setCatalogImages([]);
        setCatalogGroups([]);
        setLoadingCatalog(false);
        return;
      }
      let allImages = [];
      for (const catalog of catalogs) {
        const { data: images } = await supabase
          .from("catalog_images")
          .select("image_url")
          .eq("catalog_id", catalog.id)
          .order("display_order");
        if (images && images.length) {
          allImages = [...allImages, ...images];
        }
      }
      setCatalogImages(allImages);
      const groups = [];
      for (let i = 0; i < allImages.length; i += 6) {
        groups.push(allImages.slice(i, i + 6));
      }
      setCatalogGroups(groups);
      setLoadingCatalog(false);
    }

    async function fetchTestimonials() {
      const { data: killedTokens } = await supabase
        .from("tokens")
        .select("id, token_string, client_name, work_description, created_at")
        .eq("status", "killed")
        .order("created_at", { ascending: false })
        .limit(6);
      if (killedTokens && killedTokens.length > 0) {
        const withImages = await Promise.all(
          killedTokens.map(async (token) => {
            const { data: images } = await supabase
              .from("token_request_images")
              .select("image_url")
              .eq("token_id", token.id)
              .limit(1);
            return { ...token, image: images?.[0]?.image_url || null };
          })
        );
        setTestimonials(withImages);
      } else {
        setTestimonials([]);
      }
      setLoadingTestimonials(false);
    }

    async function fetchRecentReviews() {
      const { data: reviews } = await supabase
        .from("ratings")
        .select("*, showroom(description, id)")
        .order("created_at", { ascending: false })
        .limit(5);
      if (reviews) setRecentReviews(reviews);
    }

    fetchProducts();
    fetchAllCatalogImages();
    fetchTestimonials();
    fetchRecentReviews();
  }, []);

  useEffect(() => {
    if (products.length === 0) return;
    const interval = setInterval(() => {
      setImageIndices(prev => {
        const newIndices = { ...prev };
        products.forEach(p => {
          if (p.images.length > 1) {
            newIndices[p.id] = (newIndices[p.id] + 1) % p.images.length;
          }
        });
        return newIndices;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [products]);

  const handleTokenSubmit = (e) => {
    e.preventDefault();
    if (token.trim()) router.push(`/workspace/${token.trim()}`);
  };

  const getWhatsAppLink = (product) => {
    const message = `I'm interested in this product: ${product.description} for ₦${product.price}.`;
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  };

  const logout = () => {
    sessionStorage.removeItem("clientId");
    window.location.href = "/";
  };

  // Navbar
  const Navbar = () => (
    <nav className="fixed top-0 left-0 w-full z-50 bg-white/90 backdrop-blur-md shadow-sm border-b border-amber-100/20">
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between h-16">
        <a href="#home" className="text-2xl font-bold text-amber-800 font-['Dancing_Script',_cursive]">OKMADE</a>
        <div className="hidden md:flex gap-8 text-gray-700 font-medium items-center">
          <a href="#home" className="hover:text-amber-700 transition">Home</a>
          <a href="#about" className="hover:text-amber-700 transition">About</a>
          <a href="#contact" className="hover:text-amber-700 transition">Contact</a>
          <a href="#reviews" className="hover:text-amber-700 transition">Reviews</a>
          <a href="#portfolio" className="hover:text-amber-700 transition">Portfolio</a>
          {clientId ? (
            <>
              <a href="/client/dashboard" className="hover:text-amber-700 transition">Dashboard</a>
              <button onClick={logout} className="text-red-600 hover:text-red-800 transition">Logout</button>
            </>
          ) : (
            <a href="/client/login" className="hover:text-amber-700 transition">Artisan Login</a>
          )}
        </div>
        <button className="md:hidden text-2xl" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? '✕' : '☰'}
        </button>
      </div>
      {isMenuOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-md border-t border-amber-100/20 py-4 px-6 flex flex-col gap-4 text-gray-700 font-medium">
          <a href="#home" onClick={() => setIsMenuOpen(false)} className="hover:text-amber-700">Home</a>
          <a href="#about" onClick={() => setIsMenuOpen(false)} className="hover:text-amber-700">About</a>
          <a href="#contact" onClick={() => setIsMenuOpen(false)} className="hover:text-amber-700">Contact</a>
          <a href="#reviews" onClick={() => setIsMenuOpen(false)} className="hover:text-amber-700">Reviews</a>
          <a href="#portfolio" onClick={() => setIsMenuOpen(false)} className="hover:text-amber-700">Portfolio</a>
          {clientId ? (
            <>
              <a href="/client/dashboard" onClick={() => setIsMenuOpen(false)} className="hover:text-amber-700">Dashboard</a>
              <button onClick={logout} className="text-red-600 hover:text-red-800">Logout</button>
            </>
          ) : (
            <a href="/client/login" onClick={() => setIsMenuOpen(false)} className="hover:text-amber-700">Artisan Login</a>
          )}
        </div>
      )}
    </nav>
  );

  return (
    <div>
      <Navbar />

      {/* Hero */}
      <section id="home" className="relative text-white pt-16">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1589939705384-5185137a7f0f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')" }}>
          <div className="absolute inset-0 bg-amber-900/30"></div>
        </div>
        <div className="relative container mx-auto px-6 py-32 text-center">
          <p className="text-lg md:text-xl font-light text-amber-200/90 uppercase tracking-widest mb-2">Welcome to OKMADE</p>
          <h1 className="text-5xl md:text-7xl font-bold mb-4">Furniture &amp; Interiors</h1>
          <p className="text-2xl md:text-3xl font-['Dancing_Script',_cursive] text-amber-200 mb-4">
            TRUST THE PROGRESS
          </p>
          <p className="text-xl md:text-2xl max-w-2xl mx-auto">
            Handcrafted pieces for modern living – timeless design, exceptional quality.
          </p>
          <div className="mt-8 flex gap-4 justify-center flex-wrap">
            <a href="/catalog" className="bg-white text-black px-6 py-3 rounded-full font-semibold hover:bg-gray-200 transition">Open Catalogs</a>
            <a href="/portfolio" className="bg-transparent border-2 border-white px-6 py-3 rounded-full font-semibold hover:bg-white hover:text-black transition">View Our Portfolio</a>
          </div>
        </div>
      </section>

      {/* Token Workspace */}
      <section id="token" className="bg-white/80 backdrop-blur-sm py-16 border-b border-amber-100/30">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-amber-800 mb-4">Track Your Custom Work</h2>
          <p className="text-gray-600 mb-6">Enter the private token you received to see your workspace and progress.</p>
          <form onSubmit={handleTokenSubmit} className="max-w-md mx-auto flex gap-3">
            <input type="text" value={token} onChange={(e) => setToken(e.target.value)} placeholder="Your token (e.g., ABC-123)" className="flex-1 p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500" required />
            <button type="submit" className="bg-amber-600 text-white px-6 py-3 rounded-lg hover:bg-amber-700 transition">Track Work →</button>
          </form>
          <p className="text-sm text-gray-500 mt-4">Example tokens: ABC123, XYZ789 (check your email or SMS).</p>
        </div>
      </section>

      {/* Featured Pieces – without title */}
      <section id="featured" className="relative py-16 overflow-hidden bg-gradient-to-br from-amber-50/80 via-orange-50/60 to-white border-y border-amber-100/20">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-amber-200/20 blur-3xl pointer-events-none"></div>
        <div className="relative z-10 container mx-auto px-6">
          {/* NO TITLE HERE */}
          {loadingProducts ? (
            <p className="text-center text-amber-600">Loading products...</p>
          ) : products.length === 0 ? (
            <p className="text-center text-gray-500">No products yet. Check back soon!</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.slice(0, 6).map((product) => {
                const idx = imageIndices[product.id] || 0;
                return (
                  <div key={product.id} className="group bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden border border-amber-100/30 hover:-translate-y-1">
                    <div className="relative h-64 overflow-hidden bg-amber-50">
                      {product.images.length > 0 ? (
                        <img src={product.images[idx]?.image_url} alt={product.description} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">No image</div>
                      )}
                      {product.sold && <span className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold">SOLD</span>}
                      {product.images.length > 1 && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                          {product.images.map((_, i) => (
                            <span key={i} className={`w-2 h-2 rounded-full transition ${i === idx ? 'bg-amber-600' : 'bg-amber-300/60'}`} />
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <p className="text-gray-700 text-sm mb-1">{product.description}</p>
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
          )}
          {products.length > 6 && (
            <div className="text-center mt-10">
              <a href="/showroom" className="inline-block bg-amber-600 hover:bg-amber-700 text-white px-8 py-3 rounded-full transition shadow-lg hover:shadow-xl">
                View All Products →
              </a>
            </div>
          )}
        </div>
      </section>

      {/* Portfolio / Testimonials */}
      <section id="portfolio" className="py-16 bg-gradient-to-b from-white to-amber-50/50">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12 font-['Dancing_Script',_cursive] text-amber-800">Our Portfolio</h2>
          {loadingTestimonials ? (
            <p className="text-center text-gray-500">Loading projects...</p>
          ) : testimonials.length === 0 ? (
            <p className="text-center text-gray-500">No completed projects yet. Check back soon!</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {testimonials.map((t) => (
                <a key={t.id} href={`/workspace/${t.token_string}`} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition group">
                  <div className="h-64 overflow-hidden relative">
                    {t.image ? (
                      <img src={getOptimizedImage(t.image, 500)} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" alt="Project" />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">No image</div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                      <p className="text-white font-semibold text-lg">{t.client_name || "Client"}</p>
                    </div>
                  </div>
                  <div className="p-5">
                    <p className="text-gray-600 line-clamp-2">{t.work_description || "Completed furniture piece. See the full story."}</p>
                    <p className="text-sm text-amber-600 mt-3 font-medium">View Project →</p>
                  </div>
                </a>
              ))}
            </div>
          )}
          <div className="text-center mt-10">
            <a href="/testimonials" className="inline-block bg-amber-600 text-white px-8 py-3 rounded-full hover:bg-amber-700 transition">View All Projects →</a>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="relative h-[600px] md:h-[700px] flex items-center overflow-hidden">
        <div className="absolute inset-0 transition-opacity duration-1000 bg-cover bg-center" style={{ backgroundImage: `url(${aboutImages[aboutImageIndex]})` }} />
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative z-10 container mx-auto px-6 text-center text-white">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 font-['Dancing_Script',_cursive] text-amber-200 drop-shadow-lg">Crafting Interiors, Building Dreams</h2>
          <div className="max-w-3xl mx-auto bg-black/30 backdrop-blur-sm p-6 rounded-2xl border border-white/10">
            <p className="text-lg md:text-xl leading-relaxed">
              At OKMADE, we don't just build furniture – we shape spaces, create atmospheres, and bring visions to life. From the warmth of a wooden dining table to the grandeur of a hotel lobby, our work is defined by precision, passion, and a deep respect for the craft of woodworking.
            </p>
            <p className="mt-4 text-base md:text-lg leading-relaxed">
              We specialize in <span className="text-amber-200 font-semibold">full interior fit-outs</span>: hotels, churches, government houses, corporate offices, and luxury residences. Every project is a collaboration – we listen, design, build, and install with meticulous attention to detail. Our team handles everything from custom cabinetry and bespoke joinery to complete renovations and restoration of antique pieces.
            </p>
            <p className="mt-4 text-base md:text-lg leading-relaxed">
              <span className="text-amber-200 font-semibold">Beyond new creations</span>, we breathe new life into old treasures with expert repairs and restoration. Whether it's a cherished family heirloom or a damaged commercial installation, we restore its beauty and functionality.
            </p>
            <p className="mt-4 text-sm italic text-amber-200/80">
              "Furniture that tells your story – built to last, designed to inspire."
            </p>
          </div>
          <div className="mt-6 text-sm text-amber-200/70 italic">
            <span className="inline-block mx-2">✦</span>
            Featured: Hotels &bull; Churches &bull; Government Houses &bull; Corporate Offices &bull; Private Homes
            <span className="inline-block mx-2">✦</span>
          </div>
        </div>
      </section>

      {/* Contact Section – updated */}
      <section id="contact" className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-6 max-w-4xl">
          <h2 className="text-4xl font-bold text-center mb-10 font-['Dancing_Script',_cursive] text-amber-300">Get in Touch</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 text-left">
            <div>
              <p className="font-semibold text-amber-200 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                Email
              </p>
              <p className="text-gray-300">okeywoodwork@gmail.com</p>
              <p className="font-semibold text-amber-200 mt-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                WhatsApp
              </p>
              <p className="text-gray-300">09161919164</p>
              <p className="font-semibold text-amber-200 mt-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                Call
              </p>
              <p className="text-gray-300">09166300206</p>
              <p className="text-gray-300">07049264672</p>
            </div>
            <div>
              <p className="font-semibold text-amber-200 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                Location
              </p>
              <p className="text-gray-300">Aba, Abia State, Nigeria</p>
              <p className="text-gray-300 text-sm italic">Working worldwide</p>
              <p className="font-semibold text-amber-200 mt-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Availability
              </p>
              <p className="text-gray-300">Always at your service</p>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Reviews */}
      <section id="reviews" className="bg-white py-16 border-t border-gray-200">
        <div className="container mx-auto px-6 max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">Customer Reviews</h2>
          {recentReviews.length === 0 ? (
            <p className="text-center text-gray-500">No reviews yet. Be the first to review a product!</p>
          ) : (
            <div className="space-y-6">
              {recentReviews.map((review) => (
                <div key={review.id} className="border-b pb-6 last:border-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">{review.user_name}</span>
                      <StarRating rating={review.rating} />
                    </div>
                    <span className="text-xs text-gray-400">{new Date(review.created_at).toLocaleDateString()}</span>
                  </div>
                  {review.comment && <p className="text-gray-600 mt-2">{review.comment}</p>}
                  {review.showroom && (
                    <button onClick={() => router.push(`/product/${review.showroom.id}`)} className="text-amber-600 text-sm hover:underline mt-2 inline-block">
                      View product →
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Catalog Gallery */}
      <section id="catalog-gallery" className="relative py-16 overflow-hidden bg-gradient-to-br from-amber-50/80 via-orange-50/60 to-white border-t border-amber-100/30">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d97706' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} />
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-amber-200/30 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-orange-200/20 blur-3xl pointer-events-none"></div>
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-8 font-['Dancing_Script',_cursive] text-amber-800 drop-shadow-sm">Our Catalog Gallery</h2>
          {loadingCatalog ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-pulse text-amber-600">Loading catalog images...</div>
            </div>
          ) : catalogGroups.length === 0 ? (
            <p className="text-center text-gray-500">No catalog images yet. Add some from the admin panel.</p>
          ) : (
            <div className="relative max-w-6xl mx-auto">
              <div className="overflow-hidden rounded-2xl bg-white/60 backdrop-blur-sm p-4 shadow-xl">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 transition-opacity duration-700">
                  {catalogGroups[catalogGroupIndex]?.map((img, idx) => (
                    <div key={idx} className="aspect-square overflow-hidden rounded-lg shadow-md">
                      <img src={img.image_url} className="w-full h-full object-cover transition hover:scale-105 duration-300" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-center gap-2 mt-6">
                {catalogGroups.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCatalogGroupIndex(idx)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${idx === catalogGroupIndex ? 'bg-amber-600 w-6' : 'bg-amber-300/60 hover:bg-amber-400'}`}
                    aria-label={`Go to group ${idx + 1}`}
                  />
                ))}
              </div>
              <div className="text-center mt-8">
                <a href="/catalog" className="inline-block bg-amber-600 hover:bg-amber-700 text-white font-semibold px-8 py-3 rounded-full transition shadow-lg hover:shadow-xl">Explore Full Catalog →</a>
              </div>
            </div>
          )}
        </div>
      </section>

      <footer className="bg-gray-900 text-white text-center py-6 text-sm">
        <p>© 2026 OKMADE Furniture. All rights reserved.</p>
        <p className="mt-2"><a href="/admin/login" className="text-gray-400 hover:text-white transition">Admin Login</a></p>
      </footer>
    </div>
  );
}