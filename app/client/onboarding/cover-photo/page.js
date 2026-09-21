"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase-browser";

export default function OnboardingCoverPhoto() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  const supabase = createSupabaseBrowser();

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setMessage("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");
      const ext = file.name.split(".").pop();
      const fileName = `${user.id}_${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("cover-photos")
        .upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("cover-photos").getPublicUrl(fileName);

      const res = await fetch("/api/client/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auth_id: user.id, field: "cover_photo", value: urlData.publicUrl }),
      });
      if (!res.ok) throw new Error("Failed to save");
      router.push("/client/dashboard");
    } catch (err) {
      setMessage("Error: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-50 to-white py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <h1 className="text-2xl font-bold text-amber-800 mb-2">Add a Cover Photo</h1>
        <p className="text-sm text-gray-600 mb-6">Step 2 of 2 — Showcase your best work.</p>

        <div className="mb-6">
          {preview ? (
            <img src={preview} className="w-full h-40 object-cover rounded-lg border-2 border-amber-200" alt="Preview" />
          ) : (
            <div className="w-full h-40 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 border-2 border-amber-100 text-4xl">
              +
            </div>
          )}
          <input type="file" accept="image/*" id="cover-upload" onChange={handleFileChange} className="hidden" />
          <label htmlFor="cover-upload" className="inline-block mt-4 bg-amber-100 hover:bg-amber-200 text-amber-800 px-4 py-2 rounded-lg cursor-pointer text-sm font-medium transition">
            Choose Cover Photo
          </label>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => router.push("/client/dashboard")}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-lg font-medium transition"
          >
            Skip for now
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-lg font-semibold transition disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Finish"}
          </button>
        </div>
        {message && <p className={`mt-4 text-sm ${message.includes("Error") ? "text-red-500" : "text-green-600"}`}>{message}</p>}
      </div>
    </div>
  );
}
