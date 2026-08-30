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
  const [clientAddress, setClientAddress] = useState("");
  const [workDescription, setWorkDescription] = useState("");
  const [price, setPrice] = useState("");
  const [imageData, setImageData] = useState([]);
  const [generatedToken, setGeneratedToken] = useState("");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  if (typeof window !== "undefined" && sessionStorage.getItem("adminAuth") !== "true") {
    router.push("/admin/login");
    return null;
  }

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (imageData.length + files.length > 6) {
      setMessage("You can upload up to 6 request images total.");
      return;
    }
    const newImages = files.map((file) => ({ file, description: "" }));
    setImageData([...imageData, ...newImages]);
  };

  const handleDescriptionChange = (index, value) => {
    const updated = [...imageData];
    updated[index].description = value;
    setImageData(updated);
  };

  const removeImage = (index) => {
    const updated = [...imageData];
    updated.splice(index, 1);
    setImageData(updated);
  };

  const generateTokenString = () => {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!clientName || !clientContact || imageData.length === 0) {
      setMessage("Please fill all required fields and select at least one request image.");
      return;
    }
    setUploading(true);
    setMessage("");

    try {
      const tokenString = generateTokenString();

      const { data: token, error: tokenError } = await supabase
        .from("tokens")
        .insert([
          {
            token_string: tokenString,
            client_name: clientName,
            client_contact: clientContact,
            client_address: clientAddress,
            work_description: workDescription,
            price: price ? parseFloat(price) : null,
            status: "active",
            notification_method: "manual",
          },
        ])
        .select()
        .single();
      if (tokenError) throw tokenError;

      for (let i = 0; i < imageData.length; i++) {
        const { file, description: imgDesc } = imageData[i];
        const ext = file.name.split(".").pop();
        const fileName = `requests/${tokenString}_${Date.now()}_${i}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("workspace-requests")
          .upload(fileName, file);
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("workspace-requests")
          .getPublicUrl(fileName);

        await supabase.from("token_request_images").insert({
          token_id: token.id,
          image_url: urlData.publicUrl,
          display_order: i,
          description: imgDesc || null,
        });
      }

      setGeneratedToken(tokenString);
      setMessage(`Token generated: ${tokenString}`);
      setClientName("");
      setClientContact("");
      setClientAddress("");
      setWorkDescription("");
      setPrice("");
      setImageData([]);
      document.getElementById("requestImages").value = "";
    } catch (err) {
      setMessage("Error: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("Workspace link copied to clipboard!");
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Generate Client Token</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium mb-1">Client Name *</label>
          <input
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            className="w-full border p-2 rounded"
            required
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Client Contact (WhatsApp number) *</label>
          <input
            type="text"
            value={clientContact}
            onChange={(e) => setClientContact(e.target.value)}
            className="w-full border p-2 rounded"
            required
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Client Address</label>
          <textarea
            value={clientAddress}
            onChange={(e) => setClientAddress(e.target.value)}
            className="w-full border p-2 rounded"
            rows="2"
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Work Description</label>
          <textarea
            value={workDescription}
            onChange={(e) => setWorkDescription(e.target.value)}
            className="w-full border p-2 rounded"
            rows="3"
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Price (₦) (optional)</label>
          <input
            type="number"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full border p-2 rounded"
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Request Images (up to 6) *</label>
          <input
            id="requestImages"
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            className="w-full border p-2 rounded"
            required
          />
          {imageData.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
              {imageData.map((item, idx) => (
                <div key={idx} className="relative border rounded p-2 bg-gray-50">
                  <img
                    src={URL.createObjectURL(item.file)}
                    className="w-full h-24 object-cover rounded"
                    alt="Preview"
                  />
                  <input
                    type="text"
                    placeholder="Image description (optional)"
                    value={item.description}
                    onChange={(e) => handleDescriptionChange(idx, e.target.value)}
                    className="w-full mt-1 p-1 border rounded text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
          <p className="text-sm text-gray-500 mt-1">{imageData.length} file(s) selected</p>
        </div>
        <button
          type="submit"
          disabled={uploading}
          className="bg-yellow-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {uploading ? "Generating..." : "Generate Token"}
        </button>
        {message && (
          <p className={`mt-4 ${message.startsWith("Error") ? "text-red-500" : "text-green-500"}`}>
            {message}
          </p>
        )}
        {generatedToken && (
          <div className="mt-4 p-4 bg-gray-100 rounded">
            <p className="font-bold">
              Token: <span className="font-mono">{generatedToken}</span>
            </p>
            <p className="text-sm text-gray-600">Workspace URL:</p>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="text"
                readOnly
                value={`${process.env.NEXT_PUBLIC_BASE_URL}/workspace/${generatedToken}`}
                className="flex-1 p-2 border rounded text-sm bg-white"
              />
              <button
                onClick={() =>
                  copyToClipboard(
                    `${process.env.NEXT_PUBLIC_BASE_URL}/workspace/${generatedToken}`
                  )
                }
                className="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition"
              >
                Copy Link
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-2">Share this link with the client via WhatsApp.</p>
          </div>
        )}
      </form>
    </div>
  );
}