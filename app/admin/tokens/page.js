"use client";
import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function AdminTokens() {
  const [clientName, setClientName] = useState("");
  const [clientContact, setClientContact] = useState("");
  const [requestImage, setRequestImage] = useState(null);
  const [generatedToken, setGeneratedToken] = useState("");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  // Auth check
  if (typeof window !== "undefined" && sessionStorage.getItem("adminAuth") !== "true") {
    router.push("/admin/login");
    return null;
  }

  const generateTokenString = () => {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!clientName || !clientContact || !requestImage) {
      setMessage("Please fill all fields and select an image.");
      return;
    }
    setUploading(true);
    setMessage("");

    try {
      const tokenString = generateTokenString();

      // 1. Upload request image to storage
      const fileExt = requestImage.name.split(".").pop();
      const fileName = `requests/${tokenString}_${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("workspace-requests")
        .upload(fileName, requestImage);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("workspace-requests")
        .getPublicUrl(fileName);
      const imageUrl = urlData.publicUrl;

      // 2. Insert token into database
      const { error: insertError } = await supabase.from("tokens").insert([
        {
          token_string: tokenString,
          client_name: clientName,
          client_contact: clientContact,
          request_image_url: imageUrl,
          status: "active",
        },
      ]);
      if (insertError) throw insertError;

      setGeneratedToken(tokenString);
      setMessage(`Token generated successfully: ${tokenString}`);
      setClientName("");
      setClientContact("");
      setRequestImage(null);
      document.getElementById("requestImage").value = "";
    } catch (err) {
      setMessage("Error: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Generate Client Token</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium mb-1">Client Name</label>
          <input
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            className="w-full border p-2 rounded"
            required
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Client Contact (email or phone)</label>
          <input
            type="text"
            value={clientContact}
            onChange={(e) => setClientContact(e.target.value)}
            className="w-full border p-2 rounded"
            required
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Request Image (what client wants)</label>
          <input
            id="requestImage"
            type="file"
            accept="image/*"
            onChange={(e) => setRequestImage(e.target.files[0])}
            className="w-full border p-2 rounded"
            required
          />
        </div>
        <button
          type="submit"
          disabled={uploading}
          className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 disabled:opacity-50"
        >
          {uploading ? "Generating..." : "Generate Token"}
        </button>
        {message && (
          <p className={`mt-4 ${message.includes("Error") ? "text-red-500" : "text-green-500"}`}>
            {message}
          </p>
        )}
        {generatedToken && (
          <div className="mt-4 p-4 bg-gray-100 rounded">
            <p className="font-bold">Token: <span className="font-mono">{generatedToken}</span></p>
            <p className="text-sm text-gray-600">Share this token with the client.</p>
            <p className="text-sm text-gray-600 mt-2">Workspace URL: <span className="font-mono">/workspace/{generatedToken}</span></p>
          </div>
        )}
      </form>
    </div>
  );
        }
