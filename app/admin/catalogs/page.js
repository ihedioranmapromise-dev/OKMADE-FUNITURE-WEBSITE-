"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function ManageCatalogs() {
  const [catalogs, setCatalogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  if (typeof window !== "undefined" && sessionStorage.getItem("adminAuth") !== "true") {
    router.push("/admin/login");
    return null;
  }

  useEffect(() => {
    fetchCatalogs();
  }, []);

  async function fetchCatalogs() {
    const { data, error } = await supabase
      .from("catalogs")
      .select("id, title, description, created_at")
      .order("created_at", { ascending: false });
    if (!error) setCatalogs(data || []);
    setLoading(false);
  }

  async function deleteCatalog(id) {
    if (!confirm("Delete this catalog space permanently? All images will also be removed.")) return;
    // Get all catalog_images to delete storage files
    const { data: images } = await supabase
      .from("catalog_images")
      .select("image_url")
      .eq("catalog_id", id);
    if (images && images.length) {
      for (const img of images) {
        const path = img.image_url.split('/public/')[1];
        if (path) {
          await supabase.storage.from("catalog-bucket").remove([path]);
        }
      }
    }
    // Delete catalog_images rows
    await supabase.from("catalog_images").delete().eq("catalog_id", id);
    // Delete catalog
    const { error } = await supabase.from("catalogs").delete().eq("id", id);
    if (error) alert("Error deleting catalog: " + error.message);
    else fetchCatalogs();
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Manage Catalogs</h1>
      {loading ? (
        <p>Loading...</p>
      ) : catalogs.length === 0 ? (
        <p>No catalog spaces yet.</p>
      ) : (
        <table className="min-w-full bg-white border">
          <thead>
            <tr><th className="py-2 px-4 border">Title</th><th className="py-2 px-4 border">Description</th><th className="py-2 px-4 border">Created</th><th className="py-2 px-4 border">Actions</th></tr>
          </thead>
          <tbody>
            {catalogs.map((c) => (
              <tr key={c.id}>
                <td className="py-2 px-4 border">{c.title}</td>
                <td className="py-2 px-4 border">{c.description?.slice(0,50)}</td>
                <td className="py-2 px-4 border">{new Date(c.created_at).toLocaleDateString()}</td>
                <td className="py-2 px-4 border">
                  <button onClick={() => router.push(`/admin/catalogs/edit/${c.id}`)} className="bg-blue-500 text-white px-3 py-1 rounded mr-2">Edit</button>
                  <button onClick={() => deleteCatalog(c.id)} className="bg-red-500 text-white px-3 py-1 rounded">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className="mt-6">
        <button onClick={() => router.push("/admin/catalog")} className="bg-green-600 text-white px-4 py-2 rounded">Add New Catalog</button>
      </div>
    </div>
  );
  }
