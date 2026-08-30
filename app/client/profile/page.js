"use client";
import { useEffect, useState, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import bcrypt from "bcryptjs";

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
  const [profilePic, setProfilePic] = useState(null);
  const [profilePicUrl, setProfilePicUrl] = useState("");
  const [uploadingPic, setUploadingPic] = useState(false);
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

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
    setProfilePicUrl(data.profile_pic || "");
  }

  const handleProfilePicUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingPic(true);
    try {
      const clientId = sessionStorage.getItem("clientId");
      const ext = file.name.split(".").pop();
      const fileName = `profiles/${clientId}_${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("profile-pics")
        .upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage
        .from("profile-pics")
        .getPublicUrl(fileName);
      const publicUrl = urlData.publicUrl;
      // Update client record
      const { error: updateError } = await supabase
        .from("clients")
        .update({ profile_pic: publicUrl })
        .eq("id", clientId);
      if (updateError) throw updateError;
      setProfilePicUrl(publicUrl);
      setMessage("Profile picture updated!");
    } catch (err) {
      setMessage("Error uploading picture: " + err.message);
    } finally {
      setUploadingPic(false);
    }
  };

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

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setPasswordMessage("All password fields are required.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordMessage("New passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMessage("New password must be at least 6 characters.");
      return;
    }
    setPasswordLoading(true);
    setPasswordMessage("");
    try {
      const isValid = bcrypt.compareSync(currentPassword, client.password_hash);
      if (!isValid) {
        setPasswordMessage("Current password is incorrect.");
        setPasswordLoading(false);
        return;
      }
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(newPassword, salt);
      const { error } = await supabase
        .from("clients")
        .update({ password_hash: hash })
        .eq("id", client.id);
      if (error) throw error;
      setPasswordMessage("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err) {
      setPasswordMessage("Error: " + err.message);
    } finally {
      setPasswordLoading(false);
    }
  };

  if (!client) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white py-12 px-4">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-2xl font-bold text-amber-800 mb-6">Edit Profile</h1>

        {/* Profile Picture Upload */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative">
            {profilePicUrl ? (
              <img
                src={profilePicUrl}
                className="w-24 h-24 rounded-full object-cover border-4 border-amber-200"
                alt="Profile"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-3xl border-4 border-amber-200">
                👤
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current.click()}
              className="absolute bottom-0 right-0 bg-amber-600 text-white p-1 rounded-full w-8 h-8 flex items-center justify-center hover:bg-amber-700 transition"
            >
              📷
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleProfilePicUpload}
              className="hidden"
            />
          </div>
          {uploadingPic && <p className="text-sm text-gray-500 mt-2">Uploading...</p>}
        </div>

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
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full mt-1 p-3 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Calling Phone</label>
            <input type="text" value={callingPhone} onChange={(e) => setCallingPhone(e.target.value)} className="w-full mt-1 p-3 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full mt-1 p-3 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Work Address</label>
            <textarea value={workAddress} onChange={(e) => setWorkAddress(e.target.value)} rows="2" className="w-full mt-1 p-3 border rounded-lg" />
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

        {/* Change Password Section */}
        <hr className="my-6" />
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Change Password</h2>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Current Password</label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full mt-1 p-3 border rounded-lg pr-10"
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                onClick={() => setShowCurrent(!showCurrent)}
              >
                {showCurrent ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">New Password</label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full mt-1 p-3 border rounded-lg pr-10"
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                onClick={() => setShowNew(!showNew)}
              >
                {showNew ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className="w-full mt-1 p-3 border rounded-lg pr-10"
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                onClick={() => setShowConfirm(!showConfirm)}
              >
                {showConfirm ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={passwordLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
          >
            {passwordLoading ? "Updating..." : "Update Password"}
          </button>
          {passwordMessage && <p className={`text-center text-sm ${passwordMessage.includes("Error") ? "text-red-500" : "text-green-600"}`}>{passwordMessage}</p>}
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          <a href="/client/dashboard" className="text-amber-600 hover:underline">← Back to Dashboard</a>
        </p>
      </div>
    </div>
  );
}