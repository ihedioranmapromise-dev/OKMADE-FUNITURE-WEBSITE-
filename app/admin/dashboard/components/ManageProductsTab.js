"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function ManageProductsTab() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    const { data, error } = await supabase
      .from("showroom")
      .select("id, description, price, sold, created_at")
      .order("created_at", { ascending: false });
    if (!error) setProducts(data || []);
    setLoading(false);
  }

  async function deleteProduct(id) {
    if (
      !confirm(
        "Delete this product permanently? Images will also be removed."
      )
    )
      return;
    const { data: images } = await supabase
      .from("product_images")
      .select("image_url")
      .eq("product_id", id);
    if (images && images.length) {
      for (const img of images) {
        const path = img.image_url.split("/public/")[1];
        if (path) await supabase.storage.from("showroom-bucket").remove([path]);
      }
    }
    await supabase.from("product_images").delete().eq("product_id", id);
    const { error } = await supabase.from("showroom").delete().eq("id", id);
    if (error) alert("Error deleting product: " + error.message);
    else fetchProducts();
  }

  if (loading)
    return <div className="text-center py-12 text-amber-600">Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-gray-800">
        Manage Products
      </h1>
      {products.length === 0 ? (
        <p className="text-gray-500">No products yet.</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200">
          <table className="min-w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase">
                  ID
                </th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase">
                  Description
                </th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase">
                  Price
                </th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase">
                  Sold
                </th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono text-xs">
                    {p.id.slice(0, 8)}
                  </td>
                  <td className="py-3 px-4 text-sm">{p.description}</td>
                  <td className="py-3 px-4 text-sm font-medium">
                    ₦{p.price}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {p.sold ? (
                      <span className="text-red-600 font-medium">Yes</span>
                    ) : (
                      <span className="text-green-600">No</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          router.push(`/admin/products/edit/${p.id}`)
                        }
                        className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteProduct(p.id)}
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
