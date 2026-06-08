"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const auth = sessionStorage.getItem("adminAuth");
    if (auth !== "true") {
      router.push("/admin/login");
    }
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      <p className="mb-4">Welcome to your furniture business admin panel.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <a
          href="/admin/showroom"
          className="bg-green-600 text-white p-4 rounded-lg text-center hover:bg-green-700"
        >
          ➕ Add Product to Showroom
        </a>
        <a
          href="/admin/catalog"
          className="bg-purple-600 text-white p-4 rounded-lg text-center hover:bg-purple-700"
        >
          🖼️ Add Catalog Space (up to 6 images)
        </a>
        <a
          href="/admin/tokens"
          className="bg-yellow-600 text-white p-4 rounded-lg text-center hover:bg-yellow-700"
        >
          🔑 Generate Client Tokens
        </a>
        <a
          href="/admin/progress"
          className="bg-blue-600 text-white p-4 rounded-lg text-center hover:bg-blue-700"
        >
          📸 Upload Progress Images
        </a>
      </div>

      <div className="bg-gray-100 p-4 rounded-lg">
        <h2 className="font-bold mb-2">Quick Info</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Showroom products: upload, edit, mark as sold</li>
          <li>Catalog spaces: each can have up to 6 images + description</li>
          <li>Client tokens: generate for live workspace access</li>
          <li>Progress images: upload for active client tokens</li>
          <li>Kill token to auto‑publish testimonial</li>
        </ul>
      </div>
    </div>
  );
            }
