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
  const [doublePayment, setDoublePayment] = useState(false);
  const [requestImages, setRequestImages] = useState([]);
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
    if (files.length > 6) {
      setMessage("You can upload up to 6 request images.");
      return;
    }
    setRequestImages(files);
  };

  const generateTokenString = () => {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!clientName || !clientContact || requestImages.length === 0) {
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
            double_payment: doublePayment,
            status: "active",
          },
        ])
        .select()
        .single();
      if (tokenError) throw tokenError;

      for (let i = 0; i < requestImages.length; i++) {
        const file = requestImages[i];
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
        });
      }

      setGeneratedToken(tokenString);
      setMessage(`Token generated: ${tokenString}`);
      setClientName("");
      setClientContact("");
      setClientAddress("");
      setWorkDescription("");
      setPrice("");
      setDoublePayment(false);
      setRequestImages([]);
      document.getElementById("requestImages").value = "";
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
        <div><label className="block font-medium mb-1">Client Name *</label><input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} className="w-full border p-2 rounded" required /></div>
        <div><label className="block font-medium mb-1">Client Contact (email or phone) *</label><input type="text" value={clientContact} onChange={(e) => setClientContact(e.target.value)} className="w-full border p-2 rounded" required /></div>
        <div><label className="block font-medium mb-1">Client Address</label><textarea value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} className="w-full border p-2 rounded" rows="2" /></div>
        <div><label className="block font-medium mb-1">Work Description</label><textarea value={workDescription} onChange={(e) => setWorkDescription(e.target.value)} className="w-full border p-2 rounded" rows="3" /></div>
        <div><label className="block font-medium mb-1">Price (₦) (optional)</label><input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full border p-2 rounded" /></div>
        <div><label className="flex items-center gap-2"><input type="checkbox" checked={doublePayment} onChange={(e) => setDoublePayment(e.target.checked)} /> Double Payment</label></div>
        <div><label className="block font-medium mb-1">Request Images (up to 6) *</label><input id="requestImages" type="file" accept="image/*" multiple onChange={handleImageChange} className="w-full border p-2 rounded" required /><p className="text-sm text-gray-500 mt-1">{requestImages.length} file(s) selected</p></div>
        <button type="submit" disabled={uploading} className="bg-yellow-600 text-white px-4 py-2 rounded disabled:opacity-50">{uploading ? "Generating..." : "Generate Token"}</button>
        {message && <p className={`mt-4 ${message.startsWith("Error") ? "text-red-500" : "text-green-500"}`}>{message}</p>}
        {generatedToken && (<div className="mt-4 p-4 bg-gray-100 rounded"><p className="font-bold">Token: <span className="font-mono">{generatedToken}</span></p><p className="text-sm text-gray-600">Share this token with the client.</p><p className="text-sm text-gray-600 mt-2">Workspace URL: /workspace/{generatedToken}</p></div>)}
      </form>
    </div>
  );
            }
