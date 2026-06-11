"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const router = useRouter();
  useEffect(() => {
    const auth = sessionStorage.getItem("adminAuth");
    if (auth !== "true") router.push("/admin/login");
  }, []);

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <a href="/admin/showroom" className="bg-green-600 hover:bg-green-700 text-white p-6 rounded-xl text-center shadow-lg transition">➕ Add Product</a>
        <a href="/admin/products" className="bg-indigo-600 hover:bg-indigo-700 text-white p-6 rounded-xl text-center shadow-lg transition">📋 Manage Products (Edit/Delete)</a>
        <a href="/admin/catalog" className="bg-purple-600 hover:bg-purple-700 text-white p-6 rounded-xl text-center shadow-lg transition">🖼️ Add Catalog Space</a>
        <a href="/admin/catalogs" className="bg-pink-600 hover:bg-pink-700 text-white p-6 rounded-xl text-center shadow-lg transition">📂 Manage Catalogs (Edit/Delete)</a>
        <a href="/admin/tokens" className="bg-yellow-600 hover:bg-yellow-700 text-white p-6 rounded-xl text-center shadow-lg transition">🔑 Generate Token</a>
        <a href="/admin/progress" className="bg-blue-600 hover:bg-blue-700 text-white p-6 rounded-xl text-center shadow-lg transition">📸 Upload Progress & Kill Token</a>
        <a href="/admin/testimonials" className="bg-red-600 hover:bg-red-700 text-white p-6 rounded-xl text-center shadow-lg transition">⭐ Manage Testimonials (Delete)</a>
      </div>
      <div className="mt-12 bg-white p-6 rounded-xl shadow-md">
        <h2 className="font-bold text-xl mb-4">Quick Info</h2>
        <ul className="list-disc pl-6 space-y-2 text-gray-700">
          <li>Use "Manage Products" to edit/delete products and their images.</li>
          <li>Use "Manage Catalogs" to edit/delete catalog spaces.</li>
          <li>Killed tokens appear as testimonials; you can delete them from "Manage Testimonials".</li>
          <li>All deletions also remove associated images from storage.</li>
        </ul>
      </div>
    </div>
  );
}
