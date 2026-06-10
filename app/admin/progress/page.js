"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminProgress() {
  const [tokens, setTokens] = useState([]);
  const [selectedTokenId, setSelectedTokenId] = useState("");
  const [selectedTokenString, setSelectedTokenString] = useState("");
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  if (typeof window !== "undefined" && sessionStorage.getItem("adminAuth") !== "true") {
    router.push("/admin/login");
    return null;
  }

  useEffect(() => {
    async function fetchTokens() {
      const res = await fetch("/api/admin/active-tokens", { headers: { "x-admin-key": "okmade_super_secret_2026" } });
      if (res.ok) {
        const data = await res.json();
        setTokens(data);
      }
    }
    fetchTokens();
  }, []);

  const handleTokenChange = (e) => {
    const id = e.target.value;
    const token = tokens.find((t) => t.id === id);
    setSelectedTokenId(id);
    setSelectedTokenString(token ? token.token_string : "");
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
    setUploading(true);
    setMessage("");
    try {
      const formData = new FormData();
      formData.append("tokenId", selectedTokenId);
      images.forEach((img) => formData.append("progressImages", img));
      const res = await fetch("/api/admin/upload-progress", {
        method: "POST",
        headers: { "x-admin-key": "okmade_super_secret_2026" },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage(`Uploaded ${images.length} progress image(s).`);
      setImages([]);
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
    try {
      const res = await fetch("/api/admin/kill-token", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": "okmade_super_secret_2026" },
        body: JSON.stringify({ tokenId: selectedTokenId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage(`Token ${selectedTokenString} killed.`);
      // Refresh token list (you can re-fetch or just remove from state)
      const fetchRes = await fetch("/api/admin/active-tokens", { headers: { "x-admin-key": "okmade_super_secret_2026" } });
      if (fetchRes.ok) setTokens(await fetchRes.json());
      setSelectedTokenId("");
      setSelectedTokenString("");
    } catch (err) {
      setMessage("Error: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Upload Progress & Manage Tokens</h1>
      <form onSubmit={handleUpload} className="space-y-4">
        <div>
          <label className="block font-medium mb-1">Select Active Token</label>
          <select value={selectedTokenId} onChange={handleTokenChange} className="w-full border p-2 rounded" required>
            <option value="">-- Choose a token --</option>
            {tokens.map((t) => <option key={t.id} value={t.id}>{t.token_string} - {t.client_name}</option>)}
          </select>
        </div>
        <div>
          <label className="block font-medium mb-1">Progress Images (multiple allowed)</label>
          <input id="progressImages" type="file" accept="image/*" multiple onChange={handleImageChange} className="w-full border p-2 rounded" />
          <p className="text-sm text-gray-500 mt-1">{images.length} file(s) selected</p>
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={uploading} className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50">{uploading ? "Uploading..." : "Upload Progress"}</button>
          <button type="button" onClick={handleKill} disabled={uploading || !selectedTokenId} className="bg-red-600 text-white px-4 py-2 rounded disabled:opacity-50">Kill Token</button>
        </div>
        {message && <p className={`mt-4 ${message.startsWith("Error") ? "text-red-500" : "text-green-500"}`}>{message}</p>}
      </form>
    </div>
  );
                        }
