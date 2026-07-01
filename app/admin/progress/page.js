"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function AdminProgress() {
  const [tokens, setTokens] = useState([]);
  const [selectedTokenId, setSelectedTokenId] = useState("");
  const [selectedTokenString, setSelectedTokenString] = useState("");
  const [selectedClientName, setSelectedClientName] = useState("");
  const [selectedClientContact, setSelectedClientContact] = useState("");
  const [images, setImages] = useState([]);
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  if (typeof window !== "undefined" && sessionStorage.getItem("adminAuth") !== "true") {
    router.push("/admin/login");
    return null;
  }

  useEffect(() => {
    async function fetchTokens() {
      const { data, error } = await supabase
        .from("tokens")
        .select("id, token_string, client_name, client_contact, notification_method")
        .eq("status", "active")
        .order("created_at", { ascending: false });
      if (!error) setTokens(data || []);
    }
    fetchTokens();
  }, []);

  const handleTokenChange = (e) => {
    const id = e.target.value;
    const token = tokens.find((t) => t.id === id);
    setSelectedTokenId(id);
    setSelectedTokenString(token ? token.token_string : "");
    setSelectedClientName(token ? token.client_name : "");
    setSelectedClientContact(token ? token.client_contact : "");
  };

  const handleImageChange = (e) => {
    setImages(Array.from(e.target.files));
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedTokenId || images.length === 0) {
      setMessage("Select a token and at least one image.");
      return;
    }
    if (!description.trim()) {
      setMessage("Please enter a brief description of this progress.");
      return;
    }
    setUploading(true);
    setMessage("");

    try {
      // 1. Upload each image and insert into progress_images with description
      const uploadedUrls = [];
      for (let i = 0; i < images.length; i++) {
        const file = images[i];
        const ext = file.name.split(".").pop();
        const fileName = `progress/${selectedTokenString}_${Date.now()}_${i}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("workspace-progress")
          .upload(fileName, file);
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("workspace-progress")
          .getPublicUrl(fileName);
        const imageUrl = urlData.publicUrl;

        const { error: insertError } = await supabase.from("progress_images").insert([
          {
            token_id: selectedTokenId,
            image_url: imageUrl,
            description: description, // same description for all images in this batch
          },
        ]);
        if (insertError) throw insertError;
        uploadedUrls.push(imageUrl);
      }

      setMessage(`Uploaded ${images.length} progress image(s).`);

      // 2. Send WhatsApp notification via CallMeBot
      if (selectedClientContact) {
        const workspaceUrl = `${window.location.origin}/workspace/${selectedTokenString}`;
        const msg = `🪑 *OKMADE Furniture Update* 🪑\n\nHello ${selectedClientName},\n\nYour custom work is progressing!\n\n📌 *${description}*\n\n🔗 Check your workspace: ${workspaceUrl}\n\nThank you for choosing OKMADE Furniture.`;
        const encodedMsg = encodeURIComponent(msg);
        const phone = selectedClientContact.replace(/\D/g, ''); // remove non-digits
        const apiKey = process.env.NEXT_PUBLIC_CALLMEBOT_API_KEY || "";

        // Send to CallMeBot
        const res = await fetch(
          `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encodedMsg}&apikey=${apiKey}`
        );
        // Note: CallMeBot returns a plain text response; we ignore it for now.
        console.log("WhatsApp notification sent, response:", res.status);
      } else {
        console.warn("No client contact available, skipping WhatsApp notification.");
      }

      // Reset form
      setImages([]);
      setDescription("");
      document.getElementById("progressImages").value = "";
    } catch (err) {
      setMessage("Error: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleKill = async () => {
    if (!selectedTokenId) {
      setMessage("Select a token first.");
      return;
    }
    if (!confirm(`Kill token ${selectedTokenString}?`)) return;
    setUploading(true);
    const { error } = await supabase
      .from("tokens")
      .update({ status: "killed" })
      .eq("id", selectedTokenId);
    if (error) {
      setMessage("Error killing token: " + error.message);
    } else {
      setMessage(`Token ${selectedTokenString} killed.`);
      // Refresh token list
      const { data } = await supabase
        .from("tokens")
        .select("id, token_string, client_name, client_contact, notification_method")
        .eq("status", "active");
      setTokens(data || []);
      setSelectedTokenId("");
      setSelectedTokenString("");
      setSelectedClientName("");
      setSelectedClientContact("");
    }
    setUploading(false);
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Upload Progress & Manage Tokens</h1>
      <form onSubmit={handleUpload} className="space-y-4">
        <div>
          <label className="block font-medium mb-1">Select Active Token</label>
          <select value={selectedTokenId} onChange={handleTokenChange} className="w-full border p-2 rounded" required>
            <option value="">-- Choose a token --</option>
            {tokens.map((t) => (
              <option key={t.id} value={t.id}>
                {t.token_string} - {t.client_name} ({t.client_contact})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-medium mb-1">Progress Description *</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border p-2 rounded"
            rows="2"
            placeholder="E.g., Cutting wood, Assembling, Painting, Final polish..."
            required
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Progress Images (multiple allowed)</label>
          <input id="progressImages" type="file" accept="image/*" multiple onChange={handleImageChange} className="w-full border p-2 rounded" />
          <p className="text-sm text-gray-500 mt-1">{images.length} file(s) selected</p>
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={uploading} className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50">
            {uploading ? "Uploading..." : "Upload Progress & Notify Client"}
          </button>
          <button type="button" onClick={handleKill} disabled={uploading || !selectedTokenId} className="bg-red-600 text-white px-4 py-2 rounded disabled:opacity-50">
            Kill Token
          </button>
        </div>
        {message && <p className={`mt-4 ${message.startsWith("Error") ? "text-red-500" : "text-green-500"}`}>{message}</p>}
      </form>
    </div>
  );
}
