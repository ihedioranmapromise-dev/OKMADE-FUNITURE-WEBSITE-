"use client";
import { useEffect, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Navbar from "./components/Navbar";

const supabase = createSupabaseBrowser();

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "";

const BLUR =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxIDEiPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNmZWYzYzciLz48L3N2Zz4=";

const DEFAULTS = {
  hero_tagline: "Welcome to OKMADE",
  hero_title: "Furniture & Interiors",
  hero_subtitle: "TRUST THE PROGRESS",
  hero_description:
    "Handcrafted pieces for modern living – timeless design, exceptional quality.",
  about_title: "Crafting Interiors, Building Dreams",
  about_paragraph_1:
    "At OKMADE, we don't just build furniture – we shape spaces, create atmospheres, and bring visions to life. From the warmth of a wooden dining table to the grandeur of a hotel lobby, our work is defined by precision, passion, and a deep respect for the craft of woodworking.",
  about_paragraph_2:
    "We specialize in full interior fit-outs: hotels, churches, government houses, corporate offices, and luxury residences.",
  about_paragraph_3:
    "Beyond new creations, we breathe new life into old treasures with expert repairs and restoration.",
  about_quote:
    '"Furniture that tells your story – built to last, designed to inspire."',
  contact_email: "okeywoodwork@gmail.com",
  contact_phone_1: "09166300206",
  contact_phone_2: "07049264672",
  contact_address: "Aba, Abia State, Nigeria",
  social_whatsapp: "",
  social_instagram: "",
  social_facebook: "",
  social_tiktok: "",
};

function StarRating({ rating }) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <div className="flex items-center gap-0.5">
      {[...Array(full)].map((_, i) => (
        <span key={i} className="text-yellow-500">★</span>
      ))}
      {half && <span className="text-yellow-500">½</span>}
      {[...Array(empty)].map((_, i) => (
        <span key={i} className="text-gray-300 dark:text-gray-600">★</span>
      ))}
    </div>
  );
}

const WhatsAppIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const EmailIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);
const PhoneIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);
const LocationIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
const ClockIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default function Home() {
  const [content, setContent] = useState(DEFAULTS);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [catalogGroups, setCatalogGroups] = useState([]);
  const [catalogGroupIndex, setCatalogGroupIndex] = useState(0);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [testimonials, setTestimonials] = useState([]);
  const [loadingTestimonials, setLoadingTestimonials] = useState(true);
  const [recentReviews, setRecentReviews] = useState([]);
  const [token, setToken] = useState("");
  const [imageIndices, setImageIndices] = useState({});
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
    "https://images.unsplash.com/photo-1511578314322-379afb476865?w=1600&q=80",
  ];
  const [aboutImageIndex, setAboutImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setAboutImageIndex((prev) => (prev + 1) % aboutImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (catalogGroups.length === 0) return;
    const interval = setInterval(() => {
      setCatalogGroupIndex((prev) => (prev + 1) % catalogGroups.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [catalogGroups]);

  useEffect(() => {
    async function loadContent() {
      try {
        const { data } = await supabase.from("site_content").select("*");
        if (data && data.length > 0) {
          const map = { ...DEFAULTS };
          data.forEach((row) => {
            if (row.value !== null && row.value !== undefined && row.value !== "") {
              map[row.key] = row.value;
            }
          });
          setContent(map);
        }
      } catch {}
    }
    loadContent();
  }, []);

  useEffect(() => {
    async function fetchProducts() {
      try {
        // Prefer featured, fallback to newest
        let { data: featured } = await supabase
          .from("showroom")
          .select("*")
          .eq("featured", true)
          .order("created_at", { ascending: false })
          .limit(6);

        if (!featured || featured.length === 0) {
          const { data: newest } = await supabase
            .from("showroom")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(6);
          featured = newest || [];
        }

        if (featured.length === 0) {
          setProducts([]);
          setLoadingProducts(false);
          return;
        }

        const ids = featured.map((p) => p.id);

        const [imgsRes, ratingsRes] = await Promise.all([
          supabase
            .from("product_images")
            .select("product_id, image_url, display_order")
            .in("product_id", ids)
            .order("display_order", { ascending: true }),
          supabase
            .from("ratings")
            .select("product_id, rating")
            .in("product_id", ids),
        ]);

        const imgsByProduct = {};
        (imgsRes.data || []).forEach((img) => {
          if (!imgsByProduct[img.product_id]) imgsByProduct[img.product_id] = [];
          imgsByProduct[img.product_id].push(img);
        });

        const ratingsByProduct = {};
        (ratingsRes.data || []).forEach((r) => {
          if (!ratingsByProduct[r.product_id]) ratingsByProduct[r.product_id] = [];
          ratingsByProduct[r.product_id].push(r.rating);
        });

        const withDetails = featured.map((p) => {
          const imgs = imgsByProduct[p.id] || [];
          const rts = ratingsByProduct[p.id] || [];
          const avg = rts.length ? rts.reduce((a, b) => a + b, 0) / rts.length : 0;
          return {
            ...p,
            images: imgs,
            avgRating: avg,
            reviewCount: rts.length,
          };
        });

        setProducts(withDetails);
        const initialIndices = {};
        withDetails.forEach((p) => {
          initialIndices[p.id] = 0;
        });
        setImageIndices(initialIndices);
      } catch {}
      setLoadingProducts(false);
    }

    async function fetchAllCatalogImages() {
      setLoadingCatalog(true);
      try {
        const { data: catalogs } = await supabase
          .from("catalogs")
          .select("id")
          .order("created_at", { ascending: false });
        if (!catalogs || catalogs.length === 0) {
          setLoadingCatalog(false);
          return;
        }
        const catIds = catalogs.map((c) => c.id);

        const { data: allImages } = await supabase
          .from("catalog_images")
          .select("catalog_id, image_url, display_order")
          .in("catalog_id", catIds)
          .order("display_order", { ascending: true });

        const groups = [];
        for (let i = 0; i < (allImages || []).length; i += 6) {
          groups.push(allImages.slice(i, i + 6));
        }
        setCatalogGroups(groups);
      } catch {}
      setLoadingCatalog(false);
    }

    async function fetchTestimonials() {
      try {
        const { data: killedProjects } = await supabase
          .from("projects")
          .select("id, token_string, client_name, work_description, created_at, is_standalone")
          .eq("status", "killed")
          .eq("is_standalone", false)
          .order("created_at", { ascending: false })
          .limit(6);

        if (!killedProjects || killedProjects.length === 0) {
          setLoadingTestimonials(false);
          return;
        }
        const projIds = killedProjects.map((p) => p.id);

        const { data: allImgs } = await supabase
          .from("project_request_images")
          .select("project_id, image_url, display_order")
          .in("project_id", projIds)
          .order("display_order", { ascending: true });

        const firstByProject = {};
        (allImgs || []).forEach((img) => {
          if (!firstByProject[img.project_id]) {
            firstByProject[img.project_id] = img.image_url;
          }
        });

        setTestimonials(
          killedProjects.map((p) => ({
            ...p,
            image: firstByProject[p.id] || null,
          }))
        );
      } catch {}
      setLoadingTestimonials(false);
    }

    async function fetchRecentReviews() {
      try {
        const { data: reviews } = await supabase
          .from("ratings")
          .select("*, showroom(description, id)")
          .order("created_at", { ascending: false })
          .limit(5);
        if (reviews) setRecentReviews(reviews);
      } catch {}
    }

    fetchProducts();
    fetchAllCatalogImages();
    fetchTestimonials();
    fetchRecentReviews();
  }, []);

  useEffect(() => {
    if (products.length === 0) return;
    const interval = setInterval(() => {
      setImageIndices((prev) => {
        const newIndices = { ...prev };
        products.forEach((p) => {
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

  return (
    <div>
      <Navbar />

      {/* Hero */}
      <section id="home" className="relative text-white pt-16">
        <div className="relative w-full h-[500px] md:h-[600px]">
          <Image
            src="https://images.unsplash.com/photo-1589939705384-5185137a7f0f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
            alt="OKMADE Hero"
            fill
            priority
            sizes="100vw"
            className="object-cover"
            placeholder="blur"
            blurDataURL={BLUR}
          />
          <div className="absolute inset-0 bg-amber-900/30"></div>
          <div className="relative z-10 container mx-auto px-6 h-full flex flex-col justify-center text-center">
            <p className="text-lg md:text-xl font-light text-amber-200/90 uppercase tracking-widest mb-2">
              {content.hero_tagline}
            </p>
            <h1 className="text-5xl md:text-7xl font-bold mb-4">
              {content.hero_title}
            </h1>
            <p className="text-2xl md:text-3xl font-['Dancing_Script',_cursive] text-amber-200 mb-4">
              {content.hero_subtitle}
            </p>
            <p className="text-xl md:text-2xl max-w-2xl mx-auto">
              {content.hero_description}
            </p>
            <div className="mt-8 flex gap-4 justify-center flex-wrap">
              <a
                href="/catalog"
                className="bg-white text-black px-6 py-3 rounded-full font-semibold hover:bg-gray-200 transition"
              >
                Open Catalogs
              </a>
              <a
                href="/portfolio"
                className="bg-transparent border-2 border-white px-6 py-3 rounded-full font-semibold hover:bg-white hover:text-black transition"
              >
                View Our Portfolio
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Token Workspace */}
      <section id="token" className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm py-12 md:py-16 border-b border-amber-100/30 dark:border-gray-800">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-amber-800 dark:text-amber-400 mb-3 md:mb-4">
            Track Your Custom Work
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-5 md:mb-6 text-sm md:text-base">
            Enter the private token you received to see your workspace and progress.
          </p>
          <form
            onSubmit={handleTokenSubmit}
            className="max-w-md mx-auto flex flex-col sm:flex-row gap-2 sm:gap-3"
          >
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Your token (e.g., ABC-123)"
              className="flex-1 p-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm md:text-base bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
              required
            />
            <button
              type="submit"
              className="bg-amber-600 text-white px-4 py-3 rounded-lg hover:bg-amber-700 transition whitespace-nowrap text-sm md:text-base"
            >
              Track Work →
            </button>
          </form>
          <p className="text-xs md:text-sm text-gray-500 dark:text-gray-500 mt-3 md:mt-4">
            Example tokens: ABC123, XYZ789 (check your email or SMS).
          </p>
        </div>
      </section>

      {/* Locked Feed Teaser */}
      <section className="bg-gradient-to-br from-amber-900 via-amber-800 to-stone-800 text-white py-16">
        <div className="container mx-auto px-6 max-w-4xl text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-sm rounded-full mb-4 border border-white/20">
            <svg className="w-8 h-8 text-amber-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 font-['Dancing_Script',_cursive] text-amber-200">
            Live Updates
          </h2>
          <p className="text-lg text-amber-100/80 max-w-2xl mx-auto mb-8">
            Sign up to follow OKMADE and our artisans. See every project as it happens — reactions, comments, and behind-the-scenes progress.
          </p>
          <div className="relative max-w-2xl mx-auto mb-8">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 space-y-4 blur-sm select-none">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-400/30"></div>
                <div className="flex-1 text-left">
                  <div className="h-3 w-32 bg-white/20 rounded"></div>
                  <div className="h-2 w-20 bg-white/10 rounded mt-2"></div>
                </div>
              </div>
              <div className="h-3 w-3/4 bg-white/20 rounded"></div>
              <div className="h-3 w-1/2 bg-white/20 rounded"></div>
              <div className="h-40 w-full bg-white/10 rounded"></div>
            </div>
          </div>
          <a href="/client/signup" className="inline-block bg-amber-600 hover:bg-amber-700 text-white font-semibold px-8 py-3 rounded-full transition shadow-lg hover:shadow-xl">
            Sign Up Free
          </a>
          <p className="text-xs text-amber-200/60 mt-4">
            Already have an account?{" "}
            <a href="/client/login" className="text-amber-200 hover:underline">
              Log in
            </a>
          </p>
        </div>
      </section>

      {/* Featured */}
      <section id="featured" className="relative py-16 overflow-hidden bg-gradient-to-br from-amber-50/80 via-orange-50/60 to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-950 border-y border-amber-100/20 dark:border-gray-800">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-amber-200/20 dark:bg-amber-900/10 blur-3xl pointer-events-none"></div>
        <div className="relative z-10 container mx-auto px-6">
          {loadingProducts ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-900 rounded-xl shadow-md overflow-hidden border border-amber-100/30 dark:border-gray-800">
                  <div className="relative h-64 bg-amber-50 dark:bg-gray-800 animate-pulse"></div>
                  <div className="p-5 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse"></div>
                    <div className="h-8 bg-gray-100 dark:bg-gray-800 rounded animate-pulse mt-3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400">
              No products yet. Check back soon!
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.slice(0, 6).map((product, pIdx) => {
                const idx = imageIndices[product.id] || 0;
                const currentImg = product.images[idx]?.image_url;
                return (
                  <div key={product.id} className="group bg-white dark:bg-gray-900 rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden border border-amber-100/30 dark:border-gray-800 hover:-translate-y-1">
                    <div className="relative h-64 overflow-hidden bg-amber-50 dark:bg-gray-800">
                      {currentImg ? (
                        <Image
                          src={currentImg}
                          alt={product.description}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover group-hover:scale-105 transition duration-500"
                          placeholder="blur"
                          blurDataURL={BLUR}
                          priority={pIdx < 3}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-600">
                          No image
                        </div>
                      )}
                      {product.sold && (
                        <span className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold z-10">
                          SOLD
                        </span>
                      )}
                      {product.images.length > 1 && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                          {product.images.map((_, i) => (
                            <span
                              key={i}
                              className={`w-2 h-2 rounded-full transition ${
                                i === idx ? "bg-amber-600" : "bg-amber-300/60"
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <p className="text-gray-700 dark:text-gray-300 text-sm mb-1">
                        {product.description}
                      </p>
                      <div className="flex justify-between items-center mt-1">
                        <StarRating rating={product.avgRating || 0} />
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          ({product.reviewCount || 0})
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xl font-bold text-green-700 dark:text-green-400">
                          ₦{product.price}
                        </span>
                        <a
                          href={getWhatsAppLink(product)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-500 hover:text-green-600"
                        >
                          <WhatsAppIcon className="w-5 h-5" />
                        </a>
                      </div>
                      <button
                        onClick={() => router.push(`/product/${product.id}`)}
                        className="mt-3 w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 rounded-full transition"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {products.length > 0 && (
            <div className="text-center mt-10">
              <a
                href="/showroom"
                className="inline-block bg-amber-600 hover:bg-amber-700 text-white px-8 py-3 rounded-full transition shadow-lg hover:shadow-xl"
              >
                View All Products →
              </a>
            </div>
          )}
        </div>
      </section>

      {/* Portfolio */}
      <section id="portfolio" className="py-16 bg-gradient-to-b from-white to-amber-50/50 dark:from-gray-950 dark:to-gray-900">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12 font-['Dancing_Script',_cursive] text-amber-800 dark:text-amber-400">
            Our Portfolio
          </h2>
          {loadingTestimonials ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-900 rounded-xl shadow-md overflow-hidden">
                  <div className="h-64 bg-amber-50 dark:bg-gray-800 animate-pulse"></div>
                  <div className="p-5">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : testimonials.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400">
              No completed projects yet. Check back soon!
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {testimonials.map((t) => (
                <a
                  key={t.id}
                  href={`/workspace/${t.token_string}`}
                  className="bg-white dark:bg-gray-900 rounded-xl shadow-md overflow-hidden hover:shadow-xl transition group"
                >
                  <div className="h-64 overflow-hidden relative">
                    {t.image ? (
                      <Image
                        src={t.image}
                        alt="Project"
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover group-hover:scale-105 transition duration-500"
                        placeholder="blur"
                        blurDataURL={BLUR}
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-gray-400">
                        No image
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 z-10">
                      <p className="text-white font-semibold text-lg">
                        {t.client_name || "Client"}
                      </p>
                    </div>
                  </div>
                  <div className="p-5">
                    <p className="text-gray-600 dark:text-gray-400 line-clamp-2">
                      {t.work_description || "Completed furniture piece."}
                    </p>
                    <p className="text-sm text-amber-600 dark:text-amber-400 mt-3 font-medium">
                      View Project →
                    </p>
                  </div>
                </a>
              ))}
            </div>
          )}
          <div className="text-center mt-10">
            <a
              href="/portfolio"
              className="inline-block bg-amber-600 text-white px-8 py-3 rounded-full hover:bg-amber-700 transition"
            >
              View All Projects →
            </a>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="relative min-h-[600px] md:min-h-[700px] flex items-center overflow-hidden py-16 md:py-24">
        <div
          className="absolute inset-0 transition-opacity duration-1000 bg-cover bg-center"
          style={{ backgroundImage: `url(${aboutImages[aboutImageIndex]})` }}
        />
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative z-10 container mx-auto px-4 md:px-6 text-center text-white">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 font-['Dancing_Script',_cursive] text-amber-200 drop-shadow-lg">
            {content.about_title}
          </h2>
          <div className="max-w-3xl mx-auto bg-black/30 backdrop-blur-sm p-5 md:p-6 rounded-2xl border border-white/10">
            <p className="text-base md:text-xl leading-relaxed">
              {content.about_paragraph_1}
            </p>
            <p className="mt-4 text-sm md:text-lg leading-relaxed">
              {content.about_paragraph_2}
            </p>
            <p className="mt-4 text-sm md:text-lg leading-relaxed">
              {content.about_paragraph_3}
            </p>
            <p className="mt-4 text-sm italic text-amber-200/80">
              {content.about_quote}
            </p>
          </div>
          <div className="mt-6 text-xs md:text-sm text-amber-200/70 italic">
            <span className="inline-block mx-2">✦</span>
            Featured: Hotels &bull; Churches &bull; Government Houses &bull; Corporate Offices &bull; Private Homes
            <span className="inline-block mx-2">✦</span>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="bg-gray-900 dark:bg-black text-white py-16">
        <div className="container mx-auto px-6 max-w-4xl">
          <h2 className="text-4xl font-bold text-center mb-10 font-['Dancing_Script',_cursive] text-amber-300">
            Get in Touch
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 text-left">
            <div>
              <p className="font-semibold text-amber-200 flex items-center gap-2">
                <EmailIcon /> Email
              </p>
              <p className="text-gray-300">{content.contact_email}</p>
              <p className="font-semibold text-amber-200 mt-4 flex items-center gap-2">
                <WhatsAppIcon className="w-5 h-5" /> WhatsApp
              </p>
              <p className="text-gray-300">{content.contact_phone_1}</p>
              <p className="font-semibold text-amber-200 mt-4 flex items-center gap-2">
                <PhoneIcon /> Call
              </p>
              <p className="text-gray-300">{content.contact_phone_1}</p>
              {content.contact_phone_2 && (
                <p className="text-gray-300">{content.contact_phone_2}</p>
              )}
            </div>
            <div>
              <p className="font-semibold text-amber-200 flex items-center gap-2">
                <LocationIcon /> Location
              </p>
              <p className="text-gray-300">{content.contact_address}</p>
              <p className="text-gray-300 text-sm italic">Working worldwide</p>
              <p className="font-semibold text-amber-200 mt-4 flex items-center gap-2">
                <ClockIcon /> Availability
              </p>
              <p className="text-gray-300">Always at your service</p>

              {(content.social_whatsapp ||
                content.social_instagram ||
                content.social_facebook ||
                content.social_tiktok) && (
                <div className="flex gap-3 mt-4">
                  {content.social_whatsapp && (
                    <a href={content.social_whatsapp} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition" aria-label="WhatsApp">
                      <WhatsAppIcon className="w-5 h-5 text-green-400" />
                    </a>
                  )}
                  {content.social_instagram && (
                    <a href={content.social_instagram} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition" aria-label="Instagram">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-pink-400">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                      </svg>
                    </a>
                  )}
                  {content.social_facebook && (
                    <a href={content.social_facebook} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition" aria-label="Facebook">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-blue-400">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    </a>
                  )}
                  {content.social_tiktok && (
                    <a href={content.social_tiktok} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition" aria-label="TikTok">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path d="M16.6 5.82s.51.5 0 0A4.278 4.278 0 0115.54 3h-3.09v12.4a2.592 2.592 0 01-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-2.84 3.37-2.22V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.89a7.35 7.35 0 002.05.52V7.62c-.75-.05-1.35-.5-1.65-1.2z"/>
                      </svg>
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section id="reviews" className="bg-white dark:bg-gray-950 py-16 border-t border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-6 max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800 dark:text-gray-100">
            Customer Reviews
          </h2>
          {recentReviews.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400">
              No reviews yet. Be the first to review a product!
            </p>
          ) : (
            <div className="space-y-6">
              {recentReviews.map((review) => (
                <div key={review.id} className="border-b border-gray-200 dark:border-gray-800 pb-6 last:border-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-gray-800 dark:text-gray-200">
                        {review.user_name}
                      </span>
                      <StarRating rating={review.rating} />
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                      {review.comment}
                    </p>
                  )}
                  {review.showroom && (
                    <button
                      onClick={() => router.push(`/product/${review.showroom.id}`)}
                      className="text-amber-600 dark:text-amber-400 text-sm hover:underline mt-2 inline-block"
                    >
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
      <section id="catalog-gallery" className="relative py-16 overflow-hidden bg-gradient-to-br from-amber-50/80 via-orange-50/60 to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-950 border-t border-amber-100/30 dark:border-gray-800">
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-8 font-['Dancing_Script',_cursive] text-amber-800 dark:text-amber-400 drop-shadow-sm">
            Our Catalog Gallery
          </h2>
          {loadingCatalog ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-pulse text-amber-600 dark:text-amber-400">
                Loading catalog images...
              </div>
            </div>
          ) : catalogGroups.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400">
              No catalog images yet.
            </p>
          ) : (
            <div className="relative max-w-6xl mx-auto">
              <div className="overflow-hidden rounded-2xl bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm p-4 shadow-xl">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 transition-opacity duration-700">
                  {catalogGroups[catalogGroupIndex]?.map((img, idx) => (
                    <div key={idx} className="aspect-square overflow-hidden rounded-lg shadow-md relative">
                      <Image
                        src={img.image_url}
                        alt="Catalog"
                        fill
                        sizes="(max-width: 768px) 50vw, 33vw"
                        className="object-cover transition hover:scale-105 duration-300"
                        placeholder="blur"
                        blurDataURL={BLUR}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-center gap-2 mt-6">
                {catalogGroups.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCatalogGroupIndex(idx)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      idx === catalogGroupIndex
                        ? "bg-amber-600 w-6"
                        : "bg-amber-300/60 hover:bg-amber-400"
                    }`}
                    aria-label={`Go to group ${idx + 1}`}
                  />
                ))}
              </div>
              <div className="text-center mt-8">
                <a
                  href="/catalog"
                  className="inline-block bg-amber-600 hover:bg-amber-700 text-white font-semibold px-8 py-3 rounded-full transition shadow-lg hover:shadow-xl"
                >
                  Explore Full Catalog →
                </a>
              </div>
            </div>
          )}
        </div>
      </section>

      <footer className="bg-gray-900 dark:bg-black text-white text-center py-6 text-sm">
        <p>© 2026 OKMADE Furniture. All rights reserved.</p>
        <p className="mt-2 flex flex-wrap justify-center gap-3">
          <a href="/terms" className="text-gray-400 hover:text-white transition">
            Terms
          </a>
          <a href="/privacy" className="text-gray-400 hover:text-white transition">
            Privacy
          </a>
          <a href="/faq" className="text-gray-400 hover:text-white transition">
            FAQ
          </a>
          <a href="/admin/login" className="text-gray-400 hover:text-white transition">
            Admin
          </a>
        </p>
      </footer>
    </div>
  );
}
