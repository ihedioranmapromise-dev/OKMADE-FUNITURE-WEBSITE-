"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function ClientProfile() {
  const [client, setClient] = useState(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [workAddress, setWorkAddress] = useState("");
  const [callingPhone, setCallingPhone] = useState("");
  const [whatsappUrl, setWhatsappUrl] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [tiktokUrl, setTiktokUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    const clientId = sessionStorage.getItem("clientId");
    if (!clientId) {
      router.push("/client/login");
      return;
    }
    fetchClient(clientId);
  }, []);

  async function fetchClient(clientId) {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("id", clientId)
      .single();
    if (error) {
      router.push("/client/login");
      return;
    }
    setClient(data);
    setDisplayName(data.display_name || "");
    setBio(data.bio || "");
    setPhone(data.phone || "");
    setEmail(data.email || "");
    setWorkAddress(data.work_address || "");
    setCallingPhone(data.calling_phone || "");
    setWhatsappUrl(data.whatsapp_url || "");
    setFacebookUrl(data.facebook_url || "");
    setTiktokUrl(data.tiktok_url || "");
    setInstagramUrl(data.instagram_url || "");
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const { error } = await supabase
        .from("clients")
        .update({
          display_name: displayName,
          bio: bio,
          phone: phone,
          email: email,
          work_address: workAddress,
          calling_phone: callingPhone,
          whatsapp_url: whatsappUrl,
          facebook_url: facebookUrl,
          tiktok_url: tiktokUrl,
          instagram_url: instagramUrl,
        })
        .eq("id", client.id);
      if (error) throw error;
      setMessage("Profile updated successfully!");
    } catch (err) {
      setMessage("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!client) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white py-12 px-4">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-2xl font-bold text-amber-800 mb-6">Edit Profile</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Display Name</label>
            <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full mt-1 p-3 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Bio / About You</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows="3" className="w-full mt-1 p-3 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone (for verification)</label>
            <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full mt-1 p-3 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Calling Phone (separate business line)</label>
            <input type="text" value={callingPhone} onChange={(e) => setCallingPhone(e.target.value)} placeholder="e.g., 2348123456789" className="w-full mt-1 p-3 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full mt-1 p-3 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Work Address</label>
            <textarea value={workAddress} onChange={(e) => setWorkAddress(e.target.value)} rows="2" placeholder="Your business or workshop address" className="w-full mt-1 p-3 border rounded-lg" />
          </div>
          <hr className="my-4" />
          <h2 className="text-lg font-semibold text-gray-800">Social Links</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700">WhatsApp URL</label>
            <input type="text" value={whatsappUrl} onChange={(e) => setWhatsappUrl(e.target.value)} placeholder="https://wa.me/2348123456789" className="w-full mt-1 p-3 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Facebook URL</label>
            <input type="text" value={facebookUrl} onChange={(e) => setFacebookUrl(e.target.value)} placeholder="https://facebook.com/yourprofile" className="w-full mt-1 p-3 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">TikTok URL</label>
            <input type="text" value={tiktokUrl} onChange={(e) => setTiktokUrl(e.target.value)} placeholder="https://tiktok.com/@yourprofile" className="w-full mt-1 p-3 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Instagram URL</label>
            <input type="text" value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} placeholder="https://instagram.com/yourprofile" className="w-full mt-1 p-3 border rounded-lg" />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50">
            {loading ? "Saving..." : "Save Changes"}
          </button>
          {message && <p className={`text-center text-sm ${message.includes("Error") ? "text-red-500" : "text-green-600"}`}>{message}</p>}
        </form>
        <p className="text-center text-sm text-gray-500 mt-4">
          <a href="/client/dashboard" className="text-amber-600 hover:underline">← Back to Dashboard</a>
        </p>
      </div>
    </div>
  );
}