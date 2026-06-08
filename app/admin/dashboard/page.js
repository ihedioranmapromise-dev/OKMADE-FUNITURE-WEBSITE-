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
      <p className="mb-4">Here you will manage:</p>
      <ul className="list-disc pl-6 space-y-2">
        <li>Showroom products (upload, edit, mark as sold)</li>
        <li>Catalog spaces (up to 6 images each)</li>
        <li>Generate client tokens for live workspace</li>
        <li>Upload progress images for active tokens</li>
        <li>Kill tokens to publish testimonials</li>
      </ul>
      <p className="mt-6 text-gray-600">Coming soon: upload forms and token manager.</p>
    </div>
  );
    }
