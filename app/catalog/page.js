"use client";
import { useEffect, useState } from "react";
import { getOptimizedImage } from "@/lib/utils";
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
    <div className="container mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold text-center mb-6">Catalog Spaces</h1>
      <div className="max-w-md mx-auto mb-8">
        <input
          type="text"
          placeholder="Search catalogs by title or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      {loading ? (
        <p className="text-center">Loading catalog...</p>
      ) : displayCatalogs.length === 0 ? (
        <p className="text-center">No catalog spaces match your search.</p>
      ) : (
        <>
          <div className="space-y-16">
            {displayCatalogs.slice(0, visibleCount).map((catalog) => (
              <div key={catalog.id} className="bg-gray-50 rounded-xl p-6 shadow">
                <h2 className="text-2xl font-bold mb-2">{catalog.title}</h2>
                <p className="text-gray-700 mb-4">{catalog.description}</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {catalog.images.map((img, idx) => (
                    <div key={idx} className="relative">
                      <img src={getOptimizedImage(img.image_url, 500)} className="w-full h-48 object-cover rounded-lg shadow" />
                      <a
                        href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`I'm interested in this catalog item: ${catalog.title}. Image: ${img.image_url}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute bottom-2 right-2 bg-green-500 text-white p-2 rounded-full text-sm hover:bg-green-600 transition"
                      >
                        📞
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {visibleCount < displayCatalogs.length && (
            <div className="text-center mt-10">
              <button onClick={loadMore} className="bg-gray-800 text-white px-8 py-3 rounded-full hover:bg-gray-900 transition">Load More</button>
            </div>
          )}
        </>
      )}
    </div>
  );
            }
