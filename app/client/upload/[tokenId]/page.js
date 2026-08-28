"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter, useParams } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function ClientUploadProgress() {
  const { tokenId } = useParams();
  const [token, setToken] = useState(null);
  const [images, setImages] = useState([]);
  const [description, setDescription] = useState("");
  const [explanation, setExplanation] = useState("");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    const clientId = sessionStorage.getItem("clientId");
    if (!clientId) {
      router.push("/client/login");
      return;
    }
    fetchToken(clientId);
  }, [tokenId]);

  async function fetchToken(clientId) {
    const { data, error } = await supabase
      .from("tokens")
      .select("id, token_string, client_id")
      .eq("id", tokenId)
      .single();
    if (error || !data || data.client_id !== clientId) {
      setMessage("You don't have permission to upload to this token.");
      return;
    }
    setToken(data);
  }

  const handleImageChange = (e) => {
    setImages(Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) return;
    if (images.length === 0) {
      setMessage("Please select at least one image.");
      return;
    }
    setUploading(true);
    setMessage("");
    try {
      const clientId = sessionStorage.getItem("clientId");
      for (let i = 0; i < images.length; i++) {
        const file = images[i];
        const ext = file.name.split(".").pop();
        const fileName = `progress/${token.token_string}_${Date.now()}_${i}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("workspace-progress")
          .upload(fileName, file);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage
          .from("workspace-progress")
          .getPublicUrl(fileName);
        const { error: insertError } = await supabase.from("progress_images").insert({
          token_id: token.id,
          image_url: urlData.publicUrl,
          description: description || "Client update",
          explanation: explanation || "",
          uploaded_by: clientId,
        });
        if (insertError) throw insertError;
      }
      // Create notification for admin
      await supabase.from("notifications").insert({
        token_id: token.id,
        type: "client_upload",
        message: `Client uploaded ${images.length} progress image(s) on token ${token.token_string}`,
      });
      setMessage(`Uploaded ${images.length} image(s) successfully!`);
      setImages([]);
      setDescription("");
      setExplanation("");
      document.getElementById("progressImages").value = "";
    } catch (err) {
      setMessage("Error: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  if (!token) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-2xl font-bold text-amber-800 mb-2">Share an Update</h1>
        <p className="text-gray-600 mb-6">Upload progress images and tell the story behind this update for <span className="font-mono">{token.token_string}</span></p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Images (up to 6)</label>
            <input id="progressImages" type="file" accept="image/*" multiple onChange={handleImageChange} className="w-full mt-1 p-2 border rounded-lg" required />
            <p className="text-sm text-gray-500 mt-1">{images.length} file(s) selected</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Short Description</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g., Wood delivered" className="w-full mt-1 p-3 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Tell the story (optional)</label>
            <textarea value={explanation} onChange={(e) => setExplanation(e.target.value)} rows="4" placeholder="Explain what's happening, any delays, or next steps..." className="w-full mt-1 p-3 border rounded-lg" />
          </div>
          <button type="submit" disabled={uploading} className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50">
            {uploading ? "Uploading..." : "Share Update"}
          </button>
          {message && <p className={`text-center text-sm ${message.includes("Error") ? "text-red-500" : "text-green-600"}`}>{message}</p>}
        </form>
        <p className="text-center text-sm text-gray-500 mt-4">Only you and the admin can see this update until the project is completed.</p>
      </div>
    </div>
  );
}
