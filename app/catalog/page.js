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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCatalogs() {
      // 1. Get all catalog entries
      const { data: catalogsData, error: catError } = await supabase
        .from("catalogs")
        .select("*")
        .order("created_at", { ascending: false });
      if (catError) {
        setLoading(false);
        return;
      }
      // 2. For each catalog, fetch its images
      const catalogsWithImages = await Promise.all(
        catalogsData.map(async (catalog) => {
          const { data: images } = await supabase
            .from("catalog_images")
            .select("image_url")
            .eq("catalog_id", catalog.id)
            .order("display_order", { ascending: true });
          return { ...catalog, images: images || [] };
        })
      );
      setCatalogs(catalogsWithImages);
      setLoading(false);
    }
    fetchCatalogs();
  }, []);

  const getWhatsAppLink = (description, imageUrl) => {
    const message = `I'm interested in this catalog item: ${description}. Image: ${imageUrl}`;
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="container mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold text-center mb-10">Catalog Spaces</h1>
      {loading ? (
        <p className="text-center">Loading catalog...</p>
      ) : catalogs.length === 0 ? (
        <p className="text-center">No catalog spaces yet.</p>
      ) : (
        <div className="space-y-16">
          {catalogs.map((catalog) => (
            <div key={catalog.id} className="bg-gray-50 rounded-xl p-6 shadow">
              <p className="text-xl font-semibold mb-4">{catalog.description}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {catalog.images.map((img, idx) => (
                  <div key={idx} className="relative">
                    <img
                      src={img.image_url}
                      className="w-full h-48 object-cover rounded-lg shadow"
                      alt={`Catalog ${catalog.id} image ${idx + 1}`}
                    />
                    <a
                      href={getWhatsAppLink(catalog.description, img.image_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute bottom-2 right-2 bg-green-500 text-white p-2 rounded-full text-sm hover:bg-green-600 transition"
                    >
                      📞 WhatsApp
                    </a>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
    }
