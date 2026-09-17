"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function ManageCatalogsTab() {
  const [catalogs, setCatalogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchCatalogs();
  }, []);

  async function fetchCatalogs() {
    const { data, error } = await supabase
      .from("catalogs")
      .select("id, title, created_at")
      .order("created_at", { ascending: false });
    if (!error) setCatalogs(data || []);
    setLoading(false);
  }

  async function deleteCatalog(id) {
    if (
      !confirm(
        "Delete this catalog space permanently? All images will be removed."
      )
    )
      return;
    const { data: images } = await supabase
      .from("catalog_images")
      .select("image_url")
      .eq("catalog_id", id);
    if (images && images.length) {
      for (const img of images) {
        const path = img.image_url.split("/public/")[1];
        if (path) await supabase.storage.from("catalog-bucket").remove([path]);
      }
    }
    await supabase.from("catalog_images").delete().eq("catalog_id", id);
    const { error } = await supabase.from("catalogs").delete().eq("id", id);
    if (error) alert("Error deleting catalog: " + error.message);
    else fetchCatalogs();
  }

  if (loading)
    return <div className="text-center py-12 text-amber-600">Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-gray-800">
        Manage Catalogs
      </h1>
      {catalogs.length === 0 ? (
        <p className="text-gray-500">No catalog spaces yet.</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200">
          <table className="min-w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase">
                  Title
                </th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase">
                  Created
                </th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {catalogs.map((c) => (
                <tr key={c.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm font-medium">
                    {c.title}
                  </td>
                  <td className="py-3 px-4 text-xs text-gray-500">
                    {new Date(c.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          router.push(`/admin/catalogs/edit/${c.id}`)
                        }
                        className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteCatalog(c.id)}
                        className="bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
