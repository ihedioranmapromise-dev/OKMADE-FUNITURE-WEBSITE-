"use client";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { adminFetch } from "@/lib/admin-client";
import AutoPostModal from "@/app/components/AutoPostModal";

const PAGE_SIZE = 12;

export default function ManageProductsTab() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(new Set());
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const [autoPostOpen, setAutoPostOpen] = useState(false);
  const [autoPostData, setAutoPostData] = useState({ type: "product", sourceId: "", defaultContent: "", previewImages: [] });

  const load = async () => {
    setLoading(true);
    const { data } = await adminFetch("/api/admin/products").then(() => ({ data: null })).catch(() => ({ data: null }));
    // We use public listing here — safe columns only
    const res = await fetch("/api/admin/products/list", { headers: { "x-admin-key": sessionStorage.getItem("adminKey") || "" } });
    setLoading(false);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    setLoading(true);
    const res = await fetch("/api/admin/products/list", {
      headers: { "x-admin-key": sessionStorage.getItem("adminKey") || "" },
    });
    if (res.ok) setProducts(await res.json());
    setLoading(false);
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter((p) => (p.description || "").toLowerCase().includes(q));
  }, [products, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSelect = (id) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const toggleSelectAll = () => {
    if (selected.size === paginated.length) setSelected(new Set());
    else setSelected(new Set(paginated.map((p) => p.id)));
  };

  const deleteProduct = async (id) => {
    if (!confirm("Delete this product permanently?")) return;
    setBusy(true);
    const res = await fetch(`/api/admin/products?id=${id}`, {
      method: "DELETE",
      headers: { "x-admin-key": sessionStorage.getItem("adminKey") || "" },
    });
    setBusy(false);
    if (res.ok) loadProducts();
    else alert("Delete failed");
  };

  const bulkDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} products permanently?`)) return;
    setBusy(true);
    for (const id of selected) {
      await fetch(`/api/admin/products?id=${id}`, {
        method: "DELETE",
        headers: { "x-admin-key": sessionStorage.getItem("adminKey") || "" },
      });
    }
    setSelected(new Set());
    setBusy(false);
    loadProducts();
  };

  const toggleFeatured = async (p) => {
    const res = await fetch("/api/admin/featured-products", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": sessionStorage.getItem("adminKey") || "",
      },
      body: JSON.stringify({ product_id: p.id, featured: !p.featured }),
    });
    if (res.ok) {
      setProducts((prev) => prev.map((x) => x.id === p.id ? { ...x, featured: !x.featured } : x));
    }
  };

  const openAutoPost = async (product) => {
    const imgsRes = await fetch(`/api/admin/products/images?id=${product.id}`, {
      headers: { "x-admin-key": sessionStorage.getItem("adminKey") || "" },
    });
    let previewImages = [];
    if (imgsRes.ok) {
      const imgs = await imgsRes.json();
      previewImages = (imgs || []).map((i) => i.image_url);
    }
    const priceStr = product.price ? ` — ₦${Number(product.price).toLocaleString()}` : "";
    setAutoPostData({
      type: "product",
      sourceId: product.id,
      defaultContent: `🛋️ New in showroom: ${product.description}${priceStr}`,
      previewImages,
    });
    setAutoPostOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Manage Products</h1>
        {selected.size > 0 && (
          <button
            onClick={bulkDelete}
            disabled={busy}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            Delete {selected.size} selected
          </button>
        )}
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full md:max-w-md p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-amber-500"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center text-gray-500 dark:text-gray-400">
          {search ? "No products match your search." : "No products yet."}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <table className="min-w-full">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="py-3 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={paginated.length > 0 && selected.size === paginated.length}
                      onChange={toggleSelectAll}
                      className="w-4 h-4"
                    />
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">ID</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Description</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Price</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Featured</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Sold</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((p) => (
                  <tr key={p.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selected.has(p.id)}
                        onChange={() => toggleSelect(p.id)}
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-gray-500 dark:text-gray-400">{p.id.slice(0, 8)}</td>
                    <td className="py-3 px-4 text-sm text-gray-800 dark:text-gray-200">{p.description}</td>
                    <td className="py-3 px-4 text-sm font-medium text-gray-800 dark:text-gray-200">₦{p.price}</td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => toggleFeatured(p)}
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          p.featured
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                            : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                        }`}
                      >
                        {p.featured ? "★ Featured" : "☆ Not"}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {p.sold ? <span className="text-red-600 dark:text-red-400 font-medium">Yes</span> : <span className="text-green-600 dark:text-green-400">No</span>}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => openAutoPost(p)}
                          className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700"
                        >
                          Post to Feed
                        </button>
                        <button
                          onClick={() => router.push(`/admin/products/edit/${p.id}`)}
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

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 disabled:opacity-40"
              >
                ← Prev
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      <AutoPostModal
        open={autoPostOpen}
        onClose={() => setAutoPostOpen(false)}
        type={autoPostData.type}
        sourceId={autoPostData.sourceId}
        defaultContent={autoPostData.defaultContent}
        previewImages={autoPostData.previewImages}
      />
    </div>
  );
}
