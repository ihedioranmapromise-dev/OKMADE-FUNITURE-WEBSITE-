"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "";

export default function CatalogPage() {
  const [catalogs, setCatalogs] = useState([]);
  const [displayCatalogs, setDisplayCatalogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [visibleCount, setVisibleCount] = useState(9);

  useEffect(() => {
    fetchCatalogs();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setDisplayCatalogs(catalogs);
    } else {
      const filtered = catalogs.filter(c =>
        c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.description.toLowerCase().includes(searchTerm.toLowerCase())
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
    if (!error && catalogsData) {
      const catalogsWithImages = await Promise.all(
        catalogsData.map(async (catalog) => {
          const { data: images } = await supabase
            .from("catalog_images")
            .select("image_url")
            .eq("catalog_id", catalog.id)
            .order("display_order");
          return { ...catalog, images: images || [] };
        })
      );
      setCatalogs(catalogsWithImages);
      setDisplayCatalogs(catalogsWithImages);
    }
    setLoading(false);
  }

  const loadMore = () => setVisibleCount(prev => prev + 9);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/50 to-white py-12">
      <div className="container mx-auto px-4 md:px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-3 tracking-tight">
            Our <span className="text-amber-700">Catalog</span> Spaces
          </h1>
          <p className="text-gray-500 max-w-xl mx-auto">Explore our curated collections of handcrafted furniture pieces.</p>
        </div>

        {/* Search Bar */}
        <div className="max-w-md mx-auto mb-10">
          <div className="relative">
            <input
              type="text"
              placeholder="Search catalogs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-4 pl-12 border border-amber-200/50 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-300 bg-white/80 backdrop-blur-sm transition"
            />
            <svg className="absolute left-4 top-4 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-pulse text-amber-600">Loading beautiful pieces...</div>
          </div>
        ) : displayCatalogs.length === 0 ? (
          <div className="text-center py-16 text-gray-400">No catalog spaces match your search.</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {displayCatalogs.slice(0, visibleCount).map((catalog) => (
                <div
                  key={catalog.id}
                  className="group bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden border border-amber-100/30 hover:-translate-y-1"
                >
                  {/* Main Image */}
                  <div className="relative h-64 overflow-hidden bg-amber-50">
                    {catalog.images.length > 0 ? (
                      <img
                        src={catalog.images[0].image_url}
                        alt={catalog.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-amber-300 text-sm">
                        No image
                      </div>
                    )}
                    {/* Decorative tag */}
                    <div className="absolute top-4 left-4 bg-amber-700/80 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full shadow-lg">
                      Featured
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h2 className="text-xl font-bold text-gray-800 mb-1 line-clamp-1">{catalog.title}</h2>
                    <p className="text-gray-500 text-sm mb-3 line-clamp-2">{catalog.description}</p>

                    {/* Thumbnails (if more than 1 image) */}
                    {catalog.images.length > 1 && (
                      <div className="flex gap-2 mb-4">
                        {catalog.images.slice(1, 4).map((img, idx) => (
                          <div key={idx} className="w-12 h-12 rounded-lg overflow-hidden border border-gray-100 flex-shrink-0">
                            <img src={img.image_url} className="w-full h-full object-cover" />
                          </div>
                        ))}
                        {catalog.images.length > 4 && (
                          <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 text-xs font-bold">
                            +{catalog.images.length - 4}
                          </div>
                        )}
                      </div>
                    )}

                    {/* CTA Button */}
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
                <button
                  onClick={loadMore}
                  className="bg-white hover:bg-amber-50 text-amber-700 border border-amber-200 px-8 py-3 rounded-full transition shadow-sm hover:shadow-md"
                >
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
