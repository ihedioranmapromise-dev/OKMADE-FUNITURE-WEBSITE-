"use client";
import { useEffect, useState, useRef } from "react";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { LocationIcon, PhoneIcon } from "@/lib/icons";
import PostCard from "@/app/components/PostCard";
import ShareMenu from "@/app/components/ShareMenu";

const BLUR = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxIDEiPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNmZWYzYzciLz48L3N2Zz4=";

const UserIcon = () => (
  <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
  </svg>
);

const VerifiedBadge = ({ isOkmade }) => (
  <svg
    className={`w-5 h-5 inline-block ml-2 ${isOkmade ? "text-amber-500" : "text-blue-500"}`}
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M12 2l2.09 2.26 3.06-.46.63 3.02 2.81 1.31-1.24 2.83 1.24 2.83-2.81 1.31-.63 3.02-3.06-.46L12 20l-2.09-2.26-3.06.46-.63-3.02L3.41 13.87l1.24-2.83-1.24-2.83 2.81-1.31.63-3.02 3.06.46L12 2z" />
    <path d="M9.5 12.5l1.8 1.8 3.7-3.7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

const SocialIcon = ({ href, children, label }) => {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="inline-block w-10 h-10 p-2 bg-gray-200 dark:bg-gray-800 rounded-full hover:bg-gray-300 dark:hover:bg-gray-700 transition"
    >
      {children}
    </a>
  );
};

function ProfileNavbar() {
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const sb = createSupabaseBrowser();
    let mounted = true;
    async function load() {
      const { data: { user } } = await sb.auth.getUser();
      if (!user) { if (mounted) setProfile(null); return; }
      const { data } = await sb.from("clients").select("username, display_name").eq("auth_id", user.id).maybeSingle();
      if (mounted) setProfile(data || null);
    }
    load();
    const { data: { subscription } } = sb.auth.onAuthStateChange(() => load());
    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const confirmLogout = async () => {
    const sb = createSupabaseBrowser();
    await sb.auth.signOut();
    setProfile(null);
    setOpen(false);
    setShowLogoutConfirm(false);
    window.location.href = "/";
  };

  return (
    <>
      <nav className="fixed top-0 left-0 w-full z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-sm border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <img src="/favicon.ico" alt="OKMADE" className="w-7 h-7 object-contain" />
            <span className="text-xl font-bold text-amber-800 dark:text-amber-400 font-['Dancing_Script',_cursive]">OKMADE</span>
          </a>

          <div className="relative" ref={ref}>
            <button onClick={() => setOpen(!open)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition" aria-label="Menu">
              <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                {open ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>

            {open && (
              <div className="absolute right-0 mt-2 w-52 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden z-50">
                <a href="/" onClick={() => setOpen(false)} className="block px-4 py-3 hover:bg-amber-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm">Home</a>
                {profile ? (
                  <>
                    <a href="/feed" onClick={() => setOpen(false)} className="block px-4 py-3 hover:bg-amber-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm">Public Feed</a>
                    <a href="/client/dashboard" onClick={() => setOpen(false)} className="block px-4 py-3 hover:bg-amber-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm">Dashboard</a>
                    <div className="border-t border-gray-100 dark:border-gray-800" />
                    <button onClick={() => { setOpen(false); setShowLogoutConfirm(true); }} className="w-full text-left px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                      Logout
                    </button>
                  </>
                ) : (
                  <a href="/client/login" onClick={() => setOpen(false)} className="block px-4 py-3 hover:bg-amber-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm">Login</a>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4" onClick={() => setShowLogoutConfirm(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">Log out?</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-5">Are you sure you want to log out?</p>
            <div className="flex gap-3">
              <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium py-2.5 rounded-lg transition">
                Cancel
              </button>
              <button onClick={confirmLogout} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 rounded-lg transition">
                Yes, Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function ClientPortfolio() {
  const params = useParams();
  const username = params?.username;
  const router = useRouter();
  const [client, setClient] = useState(null);
  const [projects, setProjects] = useState([]);
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [status, setStatus] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [statusLoaded, setStatusLoaded] = useState(false);
  const [currentUserLoaded, setCurrentUserLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const res = await fetch(`/api/public/worker/${username}/full`);
      if (!res.ok) { setLoading(false); return; }
      const data = await res.json();
      setClient(data.client);
      setProjects(data.projects || []);
      setLoading(false);
    }
    if (username) fetchData();
  }, [username]);

  useEffect(() => {
    async function loadFeed() {
      setLoadingFeed(true);
      const res = await fetch(`/api/posts?author=${username}`);
      if (res.ok) setFeed(await res.json());
      setLoadingFeed(false);
    }
    if (username) loadFeed();
  }, [username]);

  useEffect(() => {
    async function loadStatus() {
      const res = await fetch(`/api/profile-status?username=${username}`);
      if (res.ok) setStatus(await res.json());
      setStatusLoaded(true);
    }
    if (username) loadStatus();
  }, [username]);

  useEffect(() => {
    async function loadCurrentUser() {
      const sb = createSupabaseBrowser();
      const { data: { user } } = await sb.auth.getUser();
      if (!user) { setCurrentUser(null); setCurrentUserLoaded(true); return; }
      const { data } = await sb.from("clients").select("id, username").eq("auth_id", user.id).maybeSingle();
      setCurrentUser(data || null);
      setCurrentUserLoaded(true);
    }
    loadCurrentUser();
  }, []);

  const refreshStatus = async () => {
    const res = await fetch(`/api/profile-status?username=${username}`);
    if (res.ok) setStatus(await res.json());
  };

  const handleFollow = async () => {
    if (!status?.isLoggedIn) { window.location.href = "/client/login"; return; }
    setBusy(true);
    await fetch("/api/follows", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ target_username: username }) });
    await refreshStatus();
    setBusy(false);
  };

  const handleFriend = async () => {
    if (!status?.isLoggedIn) { window.location.href = "/client/login"; return; }
    setBusy(true);
    await fetch("/api/friends", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "send", target_username: username }) });
    await refreshStatus();
    setBusy(false);
  };

  const handleMessage = async () => {
    if (!status?.isLoggedIn) { window.location.href = "/client/login"; return; }
    setBusy(true);
    const res = await fetch("/api/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username }) });
    const data = await res.json();
    setBusy(false);
    if (data.thread_id) router.push(`/client/messages/${data.thread_id}`);
    else if (data.error) alert(data.error);
  };

  const toggleBlock = async () => {
    if (!status?.isLoggedIn) { window.location.href = "/client/login"; return; }
    const isBlocked = status.isBlocked;
    if (!confirm(isBlocked ? `Unblock @${username}?` : `Block @${username}? They won't be able to see your profile or message you.`)) return;
    setBusy(true);
    await fetch("/api/block", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, action: isBlocked ? "unblock" : "block" }),
    });
    await refreshStatus();
    setBusy(false);
    setMoreOpen(false);
  };

  const toggleMute = async () => {
    if (!status?.isLoggedIn) { window.location.href = "/client/login"; return; }
    const isMuted = status.isMuted;
    setBusy(true);
    await fetch("/api/mute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, action: isMuted ? "unmute" : "mute" }),
    });
    await refreshStatus();
    setBusy(false);
    setMoreOpen(false);
  };

  const handleReport = () => {
    setMoreOpen(false);
    alert("To report this user, use the flag icon on any of their posts.");
  };

  if (loading) {
    return (
      <>
        <ProfileNavbar />
        <div className="min-h-screen bg-gray-100 dark:bg-gray-950 pt-14">
          <div className="relative h-40 md:h-56 bg-amber-100 dark:bg-gray-800 animate-pulse"></div>
          <div className="max-w-4xl mx-auto bg-white dark:bg-gray-900 px-4 md:px-6">
            <div className="flex items-end justify-between -mt-16 md:-mt-20">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gray-200 dark:bg-gray-700 border-4 border-white dark:border-gray-900"></div>
            </div>
            <div className="mt-3 space-y-2 pb-6">
              <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse"></div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!client) {
    return (
      <>
        <ProfileNavbar />
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950 pt-14">
          <div className="text-red-600 dark:text-red-400">Client not found.</div>
        </div>
      </>
    );
  }

  const buttonsReady = statusLoaded && currentUserLoaded;
  const isSelf = buttonsReady && ((currentUser && currentUser.username === client.username) || status?.isSelf);
  const st = status || { isLoggedIn: false, isFollowing: false, isBlocked: false, isMuted: false, friendStatus: "none", followersCount: 0, followingCount: 0 };
  const displayName = client.display_name || client.username;
  const profileUrl = typeof window !== "undefined" ? window.location.href : "";
  const isBlockedByMe = st.isBlocked;
  const isMutedByMe = st.isMuted;

  const hasSocial =
    client.whatsapp_url ||
    client.facebook_url ||
    client.tiktok_url ||
    client.instagram_url ||
    client.twitter_url;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 pt-14 pb-8">
      <ProfileNavbar />

      <div className="max-w-4xl mx-auto">
        <div className="relative h-40 md:h-56 bg-gradient-to-r from-amber-700 to-stone-700 dark:from-gray-800 dark:to-gray-900">
          {client.cover_photo && (
            <Image src={client.cover_photo} alt="Cover" fill priority sizes="(max-width: 1024px) 100vw, 896px" className="object-cover" placeholder="blur" blurDataURL={BLUR} />
          )}
        </div>

        <div className="bg-white dark:bg-gray-900 px-4 md:px-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between -mt-16 md:-mt-20 gap-3">
            <div className="relative w-32 h-32 md:w-40 md:h-40 flex-shrink-0">
              {client.profile_pic ? (
                <Image src={client.profile_pic} alt={displayName} fill priority sizes="(max-width: 768px) 128px, 160px" className="rounded-full object-cover border-4 border-white dark:border-gray-900 shadow-lg" placeholder="blur" blurDataURL={BLUR} />
              ) : (
                <div className="w-full h-full rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-700 dark:text-amber-300 border-4 border-white dark:border-gray-900 shadow-lg">
                  <UserIcon />
                </div>
              )}
            </div>

            <div className="flex gap-2 flex-wrap items-center">
              {!buttonsReady ? (
                <>
                  <div className="h-9 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                  <div className="h-9 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                </>
              ) : isSelf ? (
                <>
                  <a href="/client/dashboard" className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition whitespace-nowrap">Dashboard</a>
                  <a href="/client/profile" className="bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg text-sm font-semibold transition whitespace-nowrap">Edit Profile</a>
                </>
              ) : (
                <>
                  {st.friendStatus === "friends" ? (
                    <button disabled className="bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg text-sm font-medium cursor-default whitespace-nowrap">✓ Friends</button>
                  ) : st.friendStatus === "pending" ? (
                    <button disabled className="bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-4 py-2 rounded-lg text-sm font-medium cursor-default whitespace-nowrap">
                      {st.requestDirection === "sent" ? "Request Sent" : "Respond in Requests"}
                    </button>
                  ) : (
                    <button onClick={handleFriend} disabled={busy || isBlockedByMe} className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50 whitespace-nowrap">+ Add Friend</button>
                  )}
                  <button onClick={handleFollow} disabled={busy || isBlockedByMe} className={`px-4 py-2 rounded-lg text-sm font-semibold transition border whitespace-nowrap ${st.isFollowing ? "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700" : "bg-white dark:bg-gray-900 border-amber-500 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20"} disabled:opacity-50`}>
                    {st.isFollowing ? "Following" : "+ Follow"}
                  </button>
                  {st.friendStatus === "friends" && !isBlockedByMe && (
                    <button onClick={handleMessage} disabled={busy} className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 px-4 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50 whitespace-nowrap">Message</button>
                  )}

                  <div className="relative">
                    <button
                      onClick={() => setMoreOpen(!moreOpen)}
                      className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded-lg transition"
                      aria-label="More options"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01" />
                      </svg>
                    </button>
                    {moreOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setMoreOpen(false)} />
                        <div className="absolute right-0 mt-2 w-56 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
                          <button
                            onClick={toggleMute}
                            className="w-full text-left px-4 py-3 hover:bg-amber-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm"
                          >
                            {isMutedByMe ? "Unmute" : "Mute"} @{username}
                          </button>
                          <button
                            onClick={handleReport}
                            className="w-full text-left px-4 py-3 hover:bg-amber-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm"
                          >
                            Report
                          </button>
                          <div className="border-t border-gray-100 dark:border-gray-800" />
                          <button
                            onClick={toggleBlock}
                            className="w-full text-left px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 text-sm"
                          >
                            {isBlockedByMe ? "Unblock" : "Block"} @{username}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="mt-3">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center flex-wrap gap-1">
              {displayName}
              {(client.is_okmade || client.verified) && <VerifiedBadge isOkmade={client.is_okmade} />}
              {isBlockedByMe && (
                <span className="ml-2 text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-2 py-1 rounded-full font-normal">
                  Blocked
                </span>
              )}
              {isMutedByMe && !isBlockedByMe && (
                <span className="ml-2 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full font-normal">
                  Muted
                </span>
              )}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              @{client.username}
              {client.skill && ` · ${client.skill}`}
              {client.work_address && ` · ${client.work_address}`}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              <strong>{st.followersCount}</strong> followers · <strong>{st.followingCount}</strong> following
            </p>
          </div>

          {client.bio && <p className="text-sm text-gray-700 dark:text-gray-300 mt-3">{client.bio}</p>}

          <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400 py-3 border-t border-gray-100 dark:border-gray-800 mt-3 items-center">
            {client.work_address && <span className="flex items-center gap-1"><LocationIcon className="w-3 h-3" /> {client.work_address}</span>}
            {client.calling_phone && <span className="flex items-center gap-1"><PhoneIcon className="w-3 h-3" /> {client.calling_phone}</span>}
            {client.age && <span>Age: {client.age}</span>}
            <ShareMenu url={profileUrl} title={`${displayName} on OKMADE`} text={`Check out ${displayName} on OKMADE`} iconOnly />
          </div>

          {hasSocial && (
            <div className="flex gap-3 pb-4 flex-wrap">
              {client.whatsapp_url && (
                <SocialIcon href={client.whatsapp_url} label="WhatsApp">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="text-green-600"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                </SocialIcon>
              )}
              {client.facebook_url && (
                <SocialIcon href={client.facebook_url} label="Facebook">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="text-blue-700"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </SocialIcon>
              )}
              {client.twitter_url && (
                <SocialIcon href={client.twitter_url} label="X (Twitter)">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="text-black dark:text-white">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </SocialIcon>
              )}
              {client.tiktok_url && (
                <SocialIcon href={client.tiktok_url} label="TikTok">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="text-black dark:text-white"><path d="M16.6 5.82s.51.5 0 0A4.278 4.278 0 0115.54 3h-3.09v12.4a2.592 2.592 0 01-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-2.84 3.37-2.22V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.89a7.35 7.35 0 002.05.52V7.62c-.75-.05-1.35-.5-1.65-1.2z"/></svg>
                </SocialIcon>
              )}
              {client.instagram_url && (
                <SocialIcon href={client.instagram_url} label="Instagram">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="text-pink-600"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                </SocialIcon>
              )}
            </div>
          )}
        </div>

        {isBlockedByMe && (
          <div className="mx-4 md:mx-6 mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-center">
            <p className="text-sm text-red-700 dark:text-red-300 font-medium">
              You blocked @{client.username}. Their posts are hidden.
            </p>
            <button onClick={toggleBlock} className="mt-2 text-xs text-red-700 dark:text-red-300 underline">
              Unblock
            </button>
          </div>
        )}

        {projects.length > 0 && !isBlockedByMe && (
          <div className="mt-4 mb-4 px-4 md:px-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">
              Projects ({projects.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map((project) => (
                <a
                  key={project.id}
                  href={`/workspace/${project.token_string || project.id}`}
                  className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-4 hover:shadow-md transition"
                >
                  <p className="font-semibold text-gray-800 dark:text-gray-200">
                    {project.work_description || "Completed Project"}
                  </p>
                  {project.city && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{project.city}</p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Completed: {new Date(project.created_at).toLocaleDateString()}
                  </p>
                </a>
              ))}
            </div>
          </div>
        )}

        {!isBlockedByMe && (
          <div className="mt-4 mb-8 px-4 md:px-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">Posts</h2>
            {loadingFeed ? (
              <div className="space-y-4">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                      <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    </div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse"></div>
                    <div className="h-48 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            ) : feed.length === 0 ? (
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-8 text-center text-gray-500 dark:text-gray-400">
                No posts yet.
              </div>
            ) : (
              <div className="space-y-4">
                {feed.map((post) => (
                  <PostCard key={post.id} post={post} currentUserId={currentUser?.id || null} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
