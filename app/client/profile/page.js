"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import PostShareModal from "./PostShareModal";

const EyeOpen = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);
const EyeOff = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
);

const UserIcon = () => (<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>);
const ContactIcon = () => (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>);
const SocialIcon = () => (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>);
const LockIcon = () => (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>);
const CameraIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
const CoverIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);
const TrashIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
  </svg>
);

function extractStoragePath(url) {
  if (!url) return null;
  const marker = "/public/";
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.slice(idx + marker.length);
}

async function uploadWithRetry(supabase, bucket, path, file, retries = 3) {
  let lastErr;
  for (let i = 0; i <= retries; i++) {
    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { cacheControl: "31536000", upsert: true });
    if (!error) return { ok: true };
    lastErr = error;
    await new Promise((r) => setTimeout(r, 500 * Math.pow(2, i)));
  }
  return { ok: false, error: lastErr };
}

export default function ClientProfile() {
  const [client, setClient] = useState(null);
  const [authEmail, setAuthEmail] = useState("");
  const [activeTab, setActiveTab] = useState("personal");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPic, setUploadingPic] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [message, setMessage] = useState("");
  const [profilePicPreview, setProfilePicPreview] = useState("");
  const [coverPreview, setCoverPreview] = useState("");
  const fileInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const router = useRouter();
  const supabase = createSupabaseBrowser();

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
  const [twitterUrl, setTwitterUrl] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // Post-share modal state
  const [shareModal, setShareModal] = useState({
    open: false,
    kind: null, // "profile_pic" | "cover_photo"
    newUrl: null,
    newPath: null, // storage path, for cleanup on cancel
    bucket: null,
  });
  const [shareSaving, setShareSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/client/login"); return; }
      setAuthEmail(user.email || "");

      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("auth_id", user.id)
        .maybeSingle();

      if (error || !data) {
        setMessage("Could not load your profile.");
        setLoading(false);
        return;
      }

      setClient(data);
      setFirstName(data.first_name || "");
      setLastName(data.last_name || "");
      setUsername(data.username || "");
      setAge(data.age || "");
      setSkill(data.skill || "");
      setPhoneNumber(data.phone_number || data.phone || "");
      setCallingPhone(data.calling_phone || "");
      setEmail(data.email || user.email || "");
      setWorkAddress(data.work_address || "");
      setDisplayName(data.display_name || "");
      setBio(data.bio || "");
      setWhatsappUrl(data.whatsapp_url || "");
      setFacebookUrl(data.facebook_url || "");
      setTiktokUrl(data.tiktok_url || "");
      setInstagramUrl(data.instagram_url || "");
      setTwitterUrl(data.twitter_url || "");
      setProfilePicPreview(data.profile_pic || "");
      setCoverPreview(data.cover_photo || "");
      setLoading(false);
    }
    load();
  }, [router, supabase]);

  const handleProfilePicUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !client) return;
    setUploadingPic(true);
    setMessage("");
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const fileName = `${client.id}/${Date.now()}.${ext}`;
      const result = await uploadWithRetry(supabase, "profile-pics", fileName, file);
      if (!result.ok) throw new Error(result.error?.message || "Upload failed after retries");
      const { data: urlData } = supabase.storage.from("profile-pics").getPublicUrl(fileName);

      // Open share modal — DB is NOT updated yet
      setShareModal({
        open: true,
        kind: "profile_pic",
        newUrl: urlData.publicUrl,
        newPath: fileName,
        bucket: "profile-pics",
      });
    } catch (err) {
      setMessage("Error uploading picture: " + err.message);
    } finally {
      setUploadingPic(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !client) return;
    setUploadingCover(true);
    setMessage("");
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const fileName = `${client.id}/${Date.now()}.${ext}`;
      const result = await uploadWithRetry(supabase, "cover-photos", fileName, file);
      if (!result.ok) throw new Error(result.error?.message || "Upload failed after retries");
      const { data: urlData } = supabase.storage.from("cover-photos").getPublicUrl(fileName);

      setShareModal({
        open: true,
        kind: "cover_photo",
        newUrl: urlData.publicUrl,
        newPath: fileName,
        bucket: "cover-photos",
      });
    } catch (err) {
      setMessage("Error uploading cover: " + err.message);
    } finally {
      setUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = "";
    }
  };

  const handleShareCancel = async () => {
    if (!shareModal.open) return;
    try {
      if (shareModal.newPath && shareModal.bucket) {
        await supabase.storage.from(shareModal.bucket).remove([shareModal.newPath]);
      }
    } catch {}
    setShareModal({ open: false, kind: null, newUrl: null, newPath: null, bucket: null });
    setMessage("Cancelled. Nothing was changed.");
  };

  const handleShareConfirm = async (shareChecked, text) => {
    if (!client || !shareModal.open) return;
    setShareSaving(true);
    setMessage("");
    try {
      const column = shareModal.kind === "cover_photo" ? "cover_photo" : "profile_pic";

      // Delete old file from storage first (free space)
      const oldUrl = shareModal.kind === "cover_photo" ? client.cover_photo : client.profile_pic;
      const oldPath = extractStoragePath(oldUrl);
      if (oldPath && shareModal.bucket) {
        try {
          await supabase.storage.from(shareModal.bucket).remove([oldPath]);
        } catch {}
      }

      // Update DB with the new URL
      const { error: updateError } = await supabase
        .from("clients")
        .update({ [column]: shareModal.newUrl })
        .eq("id", client.id);
      if (updateError) throw updateError;

      // If sharing, create the auto-post
      if (shareChecked) {
        const res = await fetch("/api/posts/auto", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: text,
            image_url: shareModal.newUrl,
            auto_source: shareModal.kind,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Post failed");
        }
      }

      // Update local state
      if (shareModal.kind === "cover_photo") {
        setCoverPreview(shareModal.newUrl);
        setClient({ ...client, cover_photo: shareModal.newUrl });
        setMessage(shareChecked ? "Cover photo updated and posted!" : "Cover photo updated!");
      } else {
        setProfilePicPreview(shareModal.newUrl);
        setClient({ ...client, profile_pic: shareModal.newUrl });
        setMessage(shareChecked ? "Profile picture updated and posted!" : "Profile picture updated!");
      }

      setShareModal({ open: false, kind: null, newUrl: null, newPath: null, bucket: null });
    } catch (err) {
      setMessage("Error: " + err.message);
    } finally {
      setShareSaving(false);
    }
  };

  const handleRemoveProfilePic = async () => {
    if (!client || !client.profile_pic) return;
    if (!confirm("Remove your profile picture?")) return;
    setMessage("");
    try {
      const path = extractStoragePath(client.profile_pic);
      if (path) {
        try {
          await supabase.storage.from("profile-pics").remove([path]);
        } catch {}
      }
      const { error } = await supabase
        .from("clients")
        .update({ profile_pic: null })
        .eq("id", client.id);
      if (error) throw error;
      setProfilePicPreview("");
      setClient({ ...client, profile_pic: null });
      setMessage("Profile picture removed.");
    } catch (err) {
      setMessage("Error: " + err.message);
    }
  };

  const handleRemoveCover = async () => {
    if (!client || !client.cover_photo) return;
    if (!confirm("Remove your cover photo?")) return;
    setMessage("");
    try {
      const path = extractStoragePath(client.cover_photo);
      if (path) {
        try {
          await supabase.storage.from("cover-photos").remove([path]);
        } catch {}
      }
      const { error } = await supabase
        .from("clients")
        .update({ cover_photo: null })
        .eq("id", client.id);
      if (error) throw error;
      setCoverPreview("");
      setClient({ ...client, cover_photo: null });
      setMessage("Cover photo removed.");
    } catch (err) {
      setMessage("Error: " + err.message);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!client) return;
    setSaving(true);
    setMessage("");
    try {
      const { error } = await supabase
        .from("clients")
        .update({
          first_name: firstName,
          last_name: lastName,
          username,
          age: age ? parseInt(age) : null,
          skill: skill || null,
          phone_number: phoneNumber || null,
          calling_phone: callingPhone || null,
          email: email || null,
          work_address: workAddress || null,
          display_name: displayName || null,
          bio: bio || null,
          whatsapp_url: whatsappUrl || null,
          facebook_url: facebookUrl || null,
          tiktok_url: tiktokUrl || null,
          instagram_url: instagramUrl || null,
          twitter_url: twitterUrl || null,
        })
        .eq("id", client.id);
      if (error) throw error;
      setMessage("Profile updated successfully!");
    } catch (err) {
      setMessage("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessage("Please fill all password fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage("New passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMessage("Password must be at least 6 characters.");
      return;
    }
    if (currentPassword === newPassword) {
      setPasswordMessage("New password must be different from current.");
      return;
    }
    setChangingPassword(true);
    setPasswordMessage("");
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
        current_password: currentPassword,
      });
      if (error) throw error;

      setPasswordMessage("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordMessage("Error: " + err.message);
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-50 to-white dark:from-gray-950 dark:to-gray-900">
        <div className="text-amber-600 dark:text-amber-400 animate-pulse">
          Loading profile...
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-50 to-white dark:from-gray-950 dark:to-gray-900">
        <div className="text-red-600 dark:text-red-400">{message || "Profile not found."}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white dark:from-gray-950 dark:to-gray-900 py-8 px-4">
      <div className="max-w-2xl mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-amber-800 dark:text-amber-400">Edit Profile</h1>
          <a href="/client/dashboard" className="text-sm text-amber-600 dark:text-amber-400 hover:underline">← Dashboard</a>
        </div>

        {/* Cover photo */}
        <div className="relative w-full h-32 md:h-40 rounded-xl overflow-hidden mb-6 bg-gradient-to-r from-amber-700 to-stone-700 dark:from-gray-800 dark:to-gray-900">
          {coverPreview && (
            <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
          )}
          <div className="absolute bottom-2 right-2 flex gap-2">
            {coverPreview && (
              <button
                type="button"
                onClick={handleRemoveCover}
                className="bg-red-600/80 hover:bg-red-700 text-white p-2 rounded-full flex items-center justify-center transition"
                aria-label="Remove cover photo"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              className="bg-black/60 hover:bg-black/80 text-white p-2 rounded-full flex items-center justify-center transition"
              aria-label="Change cover photo"
            >
              <CoverIcon className="w-4 h-4" />
            </button>
          </div>
          <input ref={coverInputRef} type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
          {uploadingCover && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-sm">
              Uploading cover...
            </div>
          )}
        </div>

        <div className="flex flex-col items-center mb-6">
          <div className="relative">
            {profilePicPreview ? (
              <img src={profilePicPreview} className="w-24 h-24 rounded-full object-cover border-4 border-amber-200 dark:border-amber-800" alt="Profile" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-gray-400 border-4 border-amber-200 dark:border-amber-800">
                <UserIcon />
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 bg-amber-600 text-white p-1.5 rounded-full w-8 h-8 flex items-center justify-center hover:bg-amber-700 transition"
              aria-label="Change profile picture"
            >
              <CameraIcon className="w-4 h-4" />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleProfilePicUpload} className="hidden" />
            {profilePicPreview && (
              <button
                type="button"
                onClick={handleRemoveProfilePic}
                className="absolute top-0 right-0 bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-full w-7 h-7 flex items-center justify-center transition"
                aria-label="Remove profile picture"
              >
                <TrashIcon className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {uploadingPic && <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Uploading...</p>}
        </div>

        <div className="flex border-b border-gray-200 dark:border-gray-800 mb-6 overflow-x-auto">
          {[
            { id: "personal", label: "Personal", icon: <UserIcon /> },
            { id: "contact", label: "Contact", icon: <ContactIcon /> },
            { id: "social", label: "Profile & Social", icon: <SocialIcon /> },
            { id: "security", label: "Security", icon: <LockIcon /> },
          ].map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition whitespace-nowrap ${activeTab === tab.id ? "border-amber-600 text-amber-700 dark:text-amber-400" : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"}`}>
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab !== "security" && (
          <form onSubmit={handleSave}>
            {activeTab === "personal" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">First Name *</label><input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full mt-1 p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100" required /></div>
                  <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Last Name *</label><input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full mt-1 p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100" required /></div>
                </div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Username *</label><input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full mt-1 p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100" required /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Age</label><input type="number" value={age} onChange={(e) => setAge(e.target.value)} className="w-full mt-1 p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100" /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Skill / Trade</label><input type="text" value={skill} onChange={(e) => setSkill(e.target.value)} className="w-full mt-1 p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100" /></div>
              </div>
            )}

            {activeTab === "contact" && (
              <div className="space-y-4">
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number *</label><input type="text" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="w-full mt-1 p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100" required /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Calling Phone</label><input type="text" value={callingPhone} onChange={(e) => setCallingPhone(e.target.value)} className="w-full mt-1 p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100" /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email (contact)</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full mt-1 p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100" /><p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Login email: {authEmail}</p></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Work Address</label><textarea value={workAddress} onChange={(e) => setWorkAddress(e.target.value)} rows="2" className="w-full mt-1 p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100" /></div>
              </div>
            )}

            {activeTab === "social" && (
              <div className="space-y-4">
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Display Name</label><input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full mt-1 p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100" /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Bio</label><textarea value={bio} onChange={(e) => setBio(e.target.value)} rows="3" className="w-full mt-1 p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100" /></div>
                <hr className="my-2 border-gray-200 dark:border-gray-800" />
                <h3 className="font-semibold text-gray-700 dark:text-gray-300">Social Links</h3>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">WhatsApp URL</label><input type="text" value={whatsappUrl} onChange={(e) => setWhatsappUrl(e.target.value)} placeholder="https://wa.me/2348123456789" className="w-full mt-1 p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100" /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Facebook URL</label><input type="text" value={facebookUrl} onChange={(e) => setFacebookUrl(e.target.value)} className="w-full mt-1 p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100" /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">X (Twitter) URL</label><input type="text" value={twitterUrl} onChange={(e) => setTwitterUrl(e.target.value)} placeholder="https://x.com/yourhandle" className="w-full mt-1 p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100" /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">TikTok URL</label><input type="text" value={tiktokUrl} onChange={(e) => setTiktokUrl(e.target.value)} className="w-full mt-1 p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100" /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Instagram URL</label><input type="text" value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} className="w-full mt-1 p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100" /></div>
              </div>
            )}

            <button type="submit" disabled={saving} className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 mt-6">
              {saving ? "Saving..." : "Save Changes"}
            </button>
            {message && <p className={`text-center text-sm mt-2 ${message.includes("Error") ? "text-red-500" : "text-green-600 dark:text-green-400"}`}>{message}</p>}
          </form>
        )}

        {activeTab === "security" && (
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Current Password</label>
              <div className="relative">
                <input type={showCurrent ? "text" : "password"} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full mt-1 p-3 border border-gray-300 dark:border-gray-700 rounded-lg pr-12 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100" required />
                <button type="button" className="absolute inset-y-0 right-3 flex items-center text-gray-500 dark:text-gray-400 hover:text-amber-600 transition" onClick={() => setShowCurrent(!showCurrent)} aria-label={showCurrent ? "Hide" : "Show"}>
                  {showCurrent ? <EyeOff /> : <EyeOpen />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">New Password</label>
              <div className="relative">
                <input type={showNew ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full mt-1 p-3 border border-gray-300 dark:border-gray-700 rounded-lg pr-12 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100" required />
                <button type="button" className="absolute inset-y-0 right-3 flex items-center text-gray-500 dark:text-gray-400 hover:text-amber-600 transition" onClick={() => setShowNew(!showNew)} aria-label={showNew ? "Hide" : "Show"}>
                  {showNew ? <EyeOff /> : <EyeOpen />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm New Password</label>
              <div className="relative">
                <input type={showConfirm ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full mt-1 p-3 border border-gray-300 dark:border-gray-700 rounded-lg pr-12 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100" required />
                <button type="button" className="absolute inset-y-0 right-3 flex items-center text-gray-500 dark:text-gray-400 hover:text-amber-600 transition" onClick={() => setShowConfirm(!showConfirm)} aria-label={showConfirm ? "Hide" : "Show"}>
                  {showConfirm ? <EyeOff /> : <EyeOpen />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={changingPassword} className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50">
              {changingPassword ? "Updating..." : "Update Password"}
            </button>
            {passwordMessage && <p className={`text-center text-sm ${passwordMessage.includes("Error") ? "text-red-500" : "text-green-600 dark:text-green-400"}`}>{passwordMessage}</p>}
          </form>
        )}
      </div>

      <PostShareModal
        open={shareModal.open}
        imageUrl={shareModal.newUrl}
        kind={shareModal.kind}
        saving={shareSaving}
        onConfirm={handleShareConfirm}
        onCancel={handleShareCancel}
      />
    </div>
  );
}
