"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const UserIcon = () => (<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>);
const ContactIcon = () => (<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>);
const SocialIcon = () => (<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>);
const LockIcon = () => (<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>);

export default function ClientProfile() {
  const [client, setClient] = useState(null);
  const [activeTab, setActiveTab] = useState("personal");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [uploadingPic, setUploadingPic] = useState(false);
  const [profilePicPreview, setProfilePicPreview] = useState("");
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [age, setAge] = useState("");
  const [skill, setSkill] = useState("");

  const [phoneNumber, setPhoneNumber] = useState("");
  const [callingPhone, setCallingPhone] = useState("");
  const [email, setEmail] = useState("");
  const [workAddress, setWorkAddress] = useState("");

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [whatsappUrl, setWhatsappUrl] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [tiktokUrl, setTiktokUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");

  useEffect(() => {
    const clientId = sessionStorage.getItem("clientId");
    if (!clientId) {
      router.push("/client/login");
      return;
    }
    fetchProfile(clientId);
  }, []);

  async function fetchProfile(clientId) {
    const res = await fetch("/api/client/profile", {
      headers: { "x-client-id": clientId },
    });
    if (!res.ok) {
      router.push("/client/login");
      return;
    }
    const data = await res.json();
    setClient(data);
    setFirstName(data.first_name || "");
    setLastName(data.last_name || "");
    setUsername(data.username || "");
    setAge(data.age || "");
    setSkill(data.skill || "");
    setPhoneNumber(data.phone_number || data.phone || "");
    setCallingPhone(data.calling_phone || "");
    setEmail(data.email || "");
    setWorkAddress(data.work_address || "");
    setDisplayName(data.display_name || "");
    setBio(data.bio || "");
    setWhatsappUrl(data.whatsapp_url || "");
    setFacebookUrl(data.facebook_url || "");
    setTiktokUrl(data.tiktok_url || "");
    setInstagramUrl(data.instagram_url || "");
    setProfilePicPreview(data.profile_pic || "");
  }

  const handleProfilePicUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingPic(true);
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );
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

      const res = await fetch("/api/client/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-client-id": clientId,
        },
        body: JSON.stringify({ ...client, profile_pic: urlData.publicUrl }),
      });
      if (!res.ok) throw new Error("Failed to save profile picture");
      setProfilePicPreview(urlData.publicUrl);
      setMessage("Profile picture updated!");
    } catch (err) {
      setMessage("Error uploading picture: " + err.message);
    } finally {
      setUploadingPic(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const clientId = sessionStorage.getItem("clientId");
      const res = await fetch("/api/client/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-client-id": clientId,
        },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          username,
          age,
          skill,
          phone_number: phoneNumber,
          calling_phone: callingPhone,
          email,
          work_address: workAddress,
          display_name: displayName,
          bio,
          whatsapp_url: whatsappUrl,
          facebook_url: facebookUrl,
          tiktok_url: tiktokUrl,
          instagram_url: instagramUrl,
          profile_pic: profilePicPreview,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage("Profile updated successfully!");
      if (username !== sessionStorage.getItem("clientUsername")) {
        sessionStorage.setItem("clientUsername", username);
      }
    } catch (err) {
      setMessage("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessage("All fields are required.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage("New passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMessage("New password must be at least 6 characters.");
      return;
    }
    try {
      const clientId = sessionStorage.getItem("clientId");
      const res = await fetch("/api/client/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-client-id": clientId,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPasswordMessage("Password updated!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordMessage("Error: " + err.message);
    }
  };

  if (!client) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-2xl font-bold text-amber-800 mb-6">Edit Profile</h1>

        {/* Profile Picture */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative">
            {profilePicPreview ? (
              <img src={profilePicPreview} className="w-24 h-24 rounded-full object-cover border-4 border-amber-200" alt="Profile" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-3xl border-4 border-amber-200">👤</div>
            )}
            <label className="absolute bottom-0 right-0 bg-amber-600 text-white p-1 rounded-full w-8 h-8 flex items-center justify-center hover:bg-amber-700 transition cursor-pointer">
              📷
              <input type="file" accept="image/*" onChange={handleProfilePicUpload} className="hidden" />
            </label>
          </div>
          {uploadingPic && <p className="text-sm text-gray-500 mt-2">Uploading...</p>}
        </div>

        {/* Tabs */}
        <div className="flex border-b mb-6 overflow-x-auto">
          {[
            { id: "personal", label: "Personal", icon: <UserIcon /> },
            { id: "contact", label: "Contact", icon: <ContactIcon /> },
            { id: "social", label: "Profile & Social", icon: <SocialIcon /> },
            { id: "security", label: "Security", icon: <LockIcon /> },
          ].map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition whitespace-nowrap ${activeTab === tab.id ? "border-amber-600 text-amber-700" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}>
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSave}>
          {activeTab === "personal" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-gray-700">First Name *</label><input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full mt-1 p-3 border rounded-lg" required /></div>
                <div><label className="block text-sm font-medium text-gray-700">Last Name *</label><input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full mt-1 p-3 border rounded-lg" required /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700">Username *</label><input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full mt-1 p-3 border rounded-lg" required /></div>
              <div><label className="block text-sm font-medium text-gray-700">Age</label><input type="number" value={age} onChange={(e) => setAge(e.target.value)} className="w-full mt-1 p-3 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-gray-700">Skill / Trade</label><input type="text" value={skill} onChange={(e) => setSkill(e.target.value)} className="w-full mt-1 p-3 border rounded-lg" /></div>
            </div>
          )}

          {activeTab === "contact" && (
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700">Phone Number *</label><input type="text" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="w-full mt-1 p-3 border rounded-lg" required /></div>
              <div><label className="block text-sm font-medium text-gray-700">Calling Phone</label><input type="text" value={callingPhone} onChange={(e) => setCallingPhone(e.target.value)} className="w-full mt-1 p-3 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-gray-700">Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full mt-1 p-3 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-gray-700">Work Address</label><textarea value={workAddress} onChange={(e) => setWorkAddress(e.target.value)} rows="2" className="w-full mt-1 p-3 border rounded-lg" /></div>
            </div>
          )}

          {activeTab === "social" && (
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700">Display Name</label><input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full mt-1 p-3 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-gray-700">Bio</label><textarea value={bio} onChange={(e) => setBio(e.target.value)} rows="3" className="w-full mt-1 p-3 border rounded-lg" /></div>
              <hr className="my-2" />
              <h3 className="font-semibold text-gray-700">Social Links</h3>
              <div><label className="block text-sm font-medium text-gray-700">WhatsApp URL</label><input type="text" value={whatsappUrl} onChange={(e) => setWhatsappUrl(e.target.value)} placeholder="https://wa.me/2348123456789" className="w-full mt-1 p-3 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-gray-700">Facebook URL</label><input type="text" value={facebookUrl} onChange={(e) => setFacebookUrl(e.target.value)} className="w-full mt-1 p-3 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-gray-700">TikTok URL</label><input type="text" value={tiktokUrl} onChange={(e) => setTiktokUrl(e.target.value)} className="w-full mt-1 p-3 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-gray-700">Instagram URL</label><input type="text" value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} className="w-full mt-1 p-3 border rounded-lg" /></div>
            </div>
          )}

          {activeTab !== "security" && (
            <>
              <button type="submit" disabled={loading} className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 mt-6">
                {loading ? "Saving..." : "Save Changes"}
              </button>
              {message && <p className={`text-center text-sm mt-2 ${message.includes("Error") ? "text-red-500" : "text-green-600"}`}>{message}</p>}
            </>
          )}
        </form>

        {activeTab === "security" && (
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Current Password</label>
              <div className="relative">
                <input type={showCurrent ? "text" : "password"} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full mt-1 p-3 border rounded-lg pr-10" required />
                <button type="button" className="absolute inset-y-0 right-3 flex items-center text-gray-500" onClick={() => setShowCurrent(!showCurrent)}>{showCurrent ? "👁️" : "👁️‍🗨️"}</button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">New Password</label>
              <div className="relative">
                <input type={showNew ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full mt-1 p-3 border rounded-lg pr-10" required />
                <button type="button" className="absolute inset-y-0 right-3 flex items-center text-gray-500" onClick={() => setShowNew(!showNew)}>{showNew ? "👁️" : "👁️‍🗨️"}</button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
              <div className="relative">
                <input type={showConfirm ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full mt-1 p-3 border rounded-lg pr-10" required />
                <button type="button" className="absolute inset-y-0 right-3 flex items-center text-gray-500" onClick={() => setShowConfirm(!showConfirm)}>{showConfirm ? "👁️" : "👁️‍🗨️"}</button>
              </div>
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition">Update Password</button>
            {passwordMessage && <p className={`text-center text-sm ${passwordMessage.includes("Error") ? "text-red-500" : "text-green-600"}`}>{passwordMessage}</p>}
          </form>
        )}

        <p className="text-center text-sm text-gray-500 mt-4">
          <a href="/client/dashboard" className="text-amber-600 hover:underline">← Back to Dashboard</a>
        </p>
      </div>
    </div>
  );
}
