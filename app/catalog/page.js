"use client";
import { useEffect, useState, useRef } from "react";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import Image from "next/image";
import Navbar from "@/app/components/Navbar";
import SearchInput from "@/app/components/SearchInput";

const supabase = createSupabaseBrowser();

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "";
const BLUR = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxIDEiPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNmZWYzYzciLz48L3N2Zz4=";

export default function CatalogPage() {
  const [catalogs, setCatalogs] = useState([]);
  const [displayCatalogs, setDisplayCatalogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [visibleCount, setVisibleCount] = useState(9);

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImages, setCurrentImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [zoom, setZoom] = useState(false);
  const autoPlayRef = useRef(null);

  useEffect(() => {
    fetchCatalogs();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setDisplayCatalogs(catalogs);
    } else {
      const filtered = catalogs.filter(
        (c) =>
          c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (c.description || "").toLowerCase().includes(searchTerm.toLowerCase())
      );
      setDisplayCatalogs(filtered);
    }
    setVisibleCount(9);
  }, [searchTerm, catalogs]);

  async function fetchCatalogs() {
    setLoading(true);
    const { data: catalogsData, error } = await supabase
      .from("catalogs")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !catalogsData || catalogsData.length === 0) {
      setCatalogs([]);
      setDisplayCatalogs([]);
      setLoading(false);
      return;
    }

    const ids = catalogsData.map((c) => c.id);
    const { data: allImages } = await supabase
      .from("catalog_images")
      .select("catalog_id, image_url, display_order")
      .in("catalog_id", ids)
      .order("display_order", { ascending: true });

    const imagesByCatalog = {};
    (allImages || []).forEach((img) => {
      if (!imagesByCatalog[img.catalog_id]) imagesByCatalog[img.catalog_id] = [];
      imagesByCatalog[img.catalog_id].push(img);
    });

    const catalogsWithImages = catalogsData.map((c) => ({ ...c, images: imagesByCatalog[c.id] || [] }));
    setCatalogs(catalogsWithImages);
    setDisplayCatalogs(catalogsWithImages);
    setLoading(false);
  }

  const loadMore = () => setVisibleCount((prev) => prev + 9);

  const openLightbox = (images, index) => {
    if (!images || images.length === 0) return;
    setCurrentImages(images);
    setCurrentIndex(index);
    setLightboxOpen(true);
    setIsPlaying(false);
    setZoom(false);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    setCurrentImages([]);
    setCurrentIndex(0);
    setIsPlaying(false);
    setZoom(false);
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
  };

  const goToPrev = (e) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? currentImages.length - 1 : prev - 1));
  };

  const goToNext = (e) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev === currentImages.length - 1 ? 0 : prev + 1));
  };

  const togglePlay = (e) => { e.stopPropagation(); setIsPlaying((prev) => !prev); };
  const toggleZoom = (e) => { e.stopPropagation(); setZoom((prev) => !prev); };

  useEffect(() => {
    if (isPlaying && lightboxOpen && currentImages.length > 1) {
      autoPlayRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev === currentImages.length - 1 ? 0 : prev + 1));
      }, 3000);
    } else {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    }
    return () => clearInterval(autoPlayRef.current);
  }, [isPlaying, lightboxOpen, currentImages.length]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/50 to-white dark:from-gray-950 dark:to-gray-900 pt-16">
      <Navbar />
      <div className="container mx-auto px-4 md:px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-gray-100 mb-3 tracking-tight">
            Our <span className="text-amber-700 dark:text-amber-400">Catalog</span> Spaces
          </h1>
          <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
            Explore our curated collections of handcrafted furniture pieces.
          </p>
        </div>

        <div className="max-w-md mx-auto mb-10">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search catalogs..."
            storageKey="okmade_recent_catalog"
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl shadow-md overflow-hidden border border-amber-100/30 dark:border-gray-800">
                <div className="h-64 bg-amber-50 dark:bg-gray-800 animate-pulse"></div>
                <div className="p-5 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        ) : displayCatalogs.length === 0 ? (
          <div className="text-center py-16 text-gray-400 dark:text-gray-500">No catalog spaces match your search.</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {displayCatalogs.slice(0, visibleCount).map((catalog, catIdx) => (
                <div key={catalog.id} className="group bg-white dark:bg-gray-900 rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden border border-amber-100/30 dark:border-gray-800 hover:-translate-y-1">
                  <div className="relative h-64 overflow-hidden bg-amber-50 dark:bg-gray-800 cursor-pointer" onClick={() => openLightbox(catalog.images, 0)}>
                    {catalog.images.length > 0 ? (
                      <Image
                        src={catalog.images[0].image_url}
                        alt={catalog.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover group-hover:scale-105 transition duration-500"
                        placeholder="blur"
                        blurDataURL={BLUR}
                        priority={catIdx < 3}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-amber-300 dark:text-gray-600 text-sm">No image</div>
                    )}
                    <div className="absolute top-4 left-4 bg-amber-700/80 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full shadow-lg z-10">Featured</div>
                    {catalog.images.length > 1 && (
                      <div className="absolute bottom-4 right-4 bg-black/50 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm z-10">
                        {catalog.images.length} images
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-1 line-clamp-1">{catalog.title}</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-3 line-clamp-2">{catalog.description}</p>
                    {catalog.images.length > 1 && (
                      <div className="flex gap-2 mb-4">
                        {catalog.images.slice(1, 4).map((img, idx) => (
                          <div key={idx} className="relative w-12 h-12 rounded-lg overflow-hidden border border-gray-100 dark:border-gray-800 flex-shrink-0 cursor-pointer" onClick={() => openLightbox(catalog.images, idx + 1)}>
                            <Image src={img.image_url} alt="" fill sizes="48px" className="object-cover" />
                          </div>
                        ))}
                        {catalog.images.length > 4 && (
                          <div className="w-12 h-12 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-700 dark:text-amber-300 text-xs font-bold cursor-pointer" onClick={() => openLightbox(catalog.images, 4)}>
                            +{catalog.images.length - 4}
                          </div>
                        )}
                      </div>
                    )}
                    <a
                      href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`I'm interested in the catalog: ${catalog.title}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-2.5 px-4 rounded-full transition shadow-sm hover:shadow-md"
                    >
                      <span className="mr-2">📞</span> Inquire via WhatsApp
                    </a>
                  </div>
                </div>
              ))}
            </div>
            {visibleCount < displayCatalogs.length && (
              <div className="text-center mt-14">
                <button onClick={loadMore} className="bg-white dark:bg-gray-800 hover:bg-amber-50 dark:hover:bg-gray-700 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-gray-700 px-8 py-3 rounded-full transition shadow-sm hover:shadow-md">
                  Load More
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {lightboxOpen && currentImages.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={closeLightbox}>
          <div className="relative max-w-5xl w-full h-auto max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <button className="absolute -top-12 right-0 text-white text-3xl hover:text-amber-300 transition" onClick={closeLightbox} aria-label="Close">✕</button>
            <div className="absolute -top-12 left-0 flex gap-3 text-white">
              {currentImages.length > 1 && (
                <button className="hover:text-amber-300 transition text-sm bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm" onClick={togglePlay}>
                  {isPlaying ? "⏸ Pause" : "▶ Play"}
                </button>
              )}
              <button className="hover:text-amber-300 transition text-sm bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm" onClick={toggleZoom}>
                {zoom ? "🔍 Zoom Out" : "🔍 Zoom In"}
              </button>
            </div>
            <div className="overflow-hidden rounded-lg flex items-center justify-center">
              <img src={currentImages[currentIndex]?.image_url} className={`max-w-full max-h-[80vh] object-contain transition-transform duration-300 ${zoom ? "scale-150 cursor-zoom-out" : "scale-100 cursor-zoom-in"}`} onClick={toggleZoom} alt="" />
            </div>
            {currentImages.length > 1 && (
              <>
                <button className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full backdrop-blur-sm transition" onClick={goToPrev} aria-label="Previous">‹</button>
                <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full backdrop-blur-sm transition" onClick={goToNext} aria-label="Next">›</button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-sm px-4 py-1 rounded-full backdrop-blur-sm">
                  {currentIndex + 1} / {currentImages.length}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
