"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import PostCard from "@/app/components/PostCard";

const BLUR = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxIDEiPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNmZWYzYzciLz48L3N2Zz4=";

const IconMenu = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01" />
  </svg>
);
const IconCamera = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
const IconEdit = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);
const IconUser = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);
const IconHome = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);
const IconFeed = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h10" />
  </svg>
);
const IconFolder = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
  </svg>
);
const IconLogout = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);
const IconBell = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
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

function ReferralCard() {
  const [data, setData] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/client/my-referral")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setData(d))
      .catch(() => {});
  }, []);

  if (!data?.code) return null;

  const link =
    typeof window !== "undefined"
      ? `${window.location.origin}/client/signup?ref=${data.code}`
      : "";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-4">
      <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">
        Invite friends
      </h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
        Share your code. {data.count} signup{data.count === 1 ? "" : "s"} so far.
      </p>
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 flex items-center gap-2">
        <span className="font-mono text-sm text-amber-700 dark:text-amber-400 font-bold flex-1 truncate">
          {data.code}
        </span>
        <button
          onClick={copy}
          className="text-xs bg-amber-600 hover:bg-amber-700 text-white px-2 py-1 rounded"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  );
}

export default function ClientDashboard() {
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");
  const [error, setError] = useState("");
  const [myPosts, setMyPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [friendRequests, setFriendRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showBell, setShowBell] = useState(false);
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const router = useRouter();
  const supabase = createSupabaseBrowser();

  useEffect(() => {
    let cancelled = false;

    async function fetchClient(userId, attempt = 0) {
      const { data, error: loadErr } = await supabase
        .from("clients")
        .select("*")
        .eq("auth_id", userId)
        .maybeSingle();

      if (cancelled) return;

      if (loadErr) {
        console.error("[dashboard] clients load error:", loadErr);
        setError("Database error: " + loadErr.message);
        setLoading(false);
        return;
      }

      if (!data && attempt === 0) {
        setTimeout(() => fetchClient(userId, 1), 800);
        return;
      }

      if (!data) {
        setError("No profile found for this account.");
        setLoading(false);
        return;
      }

      setClient(data);
      setLoading(false);
    }

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/client/login");
        return;
      }
      fetchClient(user.id);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [router, supabase]);

  useEffect(() => {
    if (!client) return;
    loadMyPosts();
    loadFriendRequests();
    loadNotifications();
  }, [client]);

  async function loadMyPosts() {
    setLoadingPosts(true);
    const res = await fetch(`/api/posts?author=${client.username}`);
    if (res.ok) setMyPosts(await res.json());
    setLoadingPosts(false);
  }

  async function loadFriendRequests() {
    const res = await fetch("/api/friends");
    if (res.ok) setFriendRequests(await res.json());
  }

  async function loadNotifications() {
    const res = await fetch("/api/notifications");
    if (res.ok) {
      const data = await res.json();
      setNotifications(Array.isArray(data) ? data : []);
    }
  }

  const respondToRequest = async (requestId, action) => {
    await fetch("/api/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, request_id: requestId }),
    });
    setFriendRequests(friendRequests.filter((r) => r.id !== requestId));
  };

  const handleNotificationClick = async (n) => {
    await fetch("/api/notifications", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: n.id }),
    });
    setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
    setShowBell(false);
    if (n.target_url) router.push(n.target_url);
  };

  const confirmLogout = async () => {
    await supabase.auth.signOut();
    setLogoutConfirm(false);
    router.push("/");
    router.refresh();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
        <div className="h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800"></div>
        <div className="relative h-40 md:h-56 bg-amber-100 dark:bg-gray-800 animate-pulse"></div>
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-end justify-between -mt-16 md:-mt-20">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gray-200 dark:bg-gray-700 border-4 border-white dark:border-gray-900"></div>
            <div className="pb-2 flex gap-2">
              <div className="h-9 w-28 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
              <div className="h-9 w-28 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
            </div>
          </div>
          <div className="mt-3 space-y-2">
            <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-50 to-white dark:from-gray-950 dark:to-gray-900">
        <div className="text-red-600 dark:text-red-400 text-lg text-center px-4">{error}</div>
      </div>
    );
  }

  const fullName = client.display_name || `${client.first_name || ""} ${client.last_name || ""}`.trim() || client.username;
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 pb-20">
      <nav className="sticky top-0 z-40 bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <img src="/favicon.ico" alt="OKMADE" className="w-8 h-8 object-contain" />
            <span className="text-xl font-bold text-amber-800 dark:text-amber-400 font-['Dancing_Script',_cursive]">OKMADE</span>
          </a>

          <div className="flex items-center gap-1">
            <div className="relative">
              <button onClick={() => setShowBell(!showBell)} className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition text-gray-700 dark:text-gray-300">
                <IconBell />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
              {showBell && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowBell(false)} />
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 z-50 max-h-96 overflow-y-auto">
                    <div className="p-3 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                      <span className="font-semibold text-sm text-gray-800 dark:text-gray-200">Notifications</span>
                      <a href="/client/notifications" className="text-xs text-amber-600 dark:text-amber-400 hover:underline">View all</a>
                    </div>
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">No notifications.</div>
                    ) : (
                      notifications.slice(0, 8).map((n) => (
                        <button
                          key={n.id}
                          onClick={() => handleNotificationClick(n)}
                          className={`w-full text-left block p-3 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 ${!n.is_read ? "bg-amber-50 dark:bg-amber-900/20" : ""}`}
                        >
                          <p className="text-sm text-gray-800 dark:text-gray-200">{n.message}</p>
                          <p className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                        </button>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="relative">
              <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition text-gray-700 dark:text-gray-300">
                <IconMenu />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 z-50 overflow-hidden">
                    <a href="/" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-amber-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm">
                      <IconHome /> Home
                    </a>
                    <a href="/feed" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-amber-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm">
                      <IconFeed /> Public Feed
                    </a>
                    <button onClick={() => { setActiveTab("projects"); setMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-amber-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm text-left">
                      <IconFolder /> Projects
                    </button>
                    <div className="border-t border-gray-100 dark:border-gray-800" />
                    <a href="/client/notifications" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-amber-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm">
                      <IconBell /> Notifications
                    </a>
                    <a href={`/client/${client.username}`} onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-amber-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm">
                      <IconUser /> View Public Profile
                    </a>
                    <a href="/client/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-amber-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm">
                      <IconEdit /> Edit Profile
                    </a>
                    <a href="/client/settings" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-amber-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm">
                      Settings
                    </a>
                    <div className="border-t border-gray-100 dark:border-gray-800" />
                    <button onClick={() => { setMenuOpen(false); setLogoutConfirm(true); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 text-sm text-left">
                      <IconLogout /> Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="relative h-40 md:h-56 bg-gradient-to-r from-amber-700 to-stone-700 dark:from-gray-800 dark:to-gray-900">
        {client.cover_photo && (
          <Image src={client.cover_photo} alt="Cover" fill priority sizes="100vw" className="object-cover" placeholder="blur" blurDataURL={BLUR} />
        )}
      </div>

      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-end justify-between -mt-16 md:-mt-20">
          <div className="relative w-32 h-32 md:w-40 md:h-40">
            {client.profile_pic ? (
              <Image src={client.profile_pic} alt={fullName} fill priority sizes="(max-width: 768px) 128px, 160px" className="rounded-full object-cover border-4 border-white dark:border-gray-900 shadow-lg" placeholder="blur" blurDataURL={BLUR} />
            ) : (
              <div className="w-full h-full rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-700 dark:text-amber-300 border-4 border-white dark:border-gray-900 shadow-lg text-5xl font-bold">
                {fullName.charAt(0).toUpperCase()}
              </div>
            )}
            <a href="/client/profile" className="absolute bottom-2 right-2 bg-white dark:bg-gray-800 hover:bg-amber-50 dark:hover:bg-gray-700 rounded-full p-2 shadow border border-gray-200 dark:border-gray-700 transition z-10" title="Change profile picture">
              <IconCamera className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            </a>
          </div>

          <div className="pb-2 flex gap-2">
            <a href={`/client/${client.username}`} className="bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg text-sm font-medium transition">
              View Public
            </a>
            <a href="/client/profile" className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition">
              Edit Profile
            </a>
          </div>
        </div>

        <div className="mt-3">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
            {fullName}
            {(client.is_okmade || client.verified) && <VerifiedBadge isOkmade={client.is_okmade} />}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            @{client.username}
            {client.skill && ` · ${client.skill}`}
            {client.work_address && ` · ${client.work_address}`}
          </p>
          {client.age && <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Age: {client.age}</p>}
        </div>

        <div className="mt-4 border-t border-gray-200 dark:border-gray-800">
          <div className="flex gap-1 md:gap-2 overflow-x-auto">
            {[
              { id: "posts", label: "My Posts" },
              { id: "about", label: "About" },
              { id: "projects", label: "Projects" },
              { id: "reviews", label: "Reviews" },
              { id: "photos", label: "Photos" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition ${
                  activeTab === tab.id
                    ? "border-amber-600 text-amber-700 dark:text-amber-400"
                    : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <aside className="hidden lg:block space-y-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-4">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">Intro</h3>
            {client.bio ? (
              <p className="text-sm text-gray-700 dark:text-gray-300">{client.bio}</p>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">No bio yet</p>
            )}
            <a href="/client/profile" className="block text-center mt-3 text-sm text-amber-600 dark:text-amber-400 hover:underline">
              Edit bio
            </a>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-4">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">Details</h3>
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              {client.skill && <li><span className="text-gray-400">Skill:</span> {client.skill}</li>}
              {client.work_address && <li><span className="text-gray-400">Location:</span> {client.work_address}</li>}
              {client.calling_phone && <li><span className="text-gray-400">Phone:</span> {client.calling_phone}</li>}
              {client.age && <li><span className="text-gray-400">Age:</span> {client.age}</li>}
            </ul>
          </div>

          <ReferralCard />
        </aside>

        <main className="lg:col-span-2 space-y-4">
          {friendRequests.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-amber-200 dark:border-amber-800 p-4">
              <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">
                Friend Requests ({friendRequests.length})
              </h3>
              <div className="space-y-3">
                {friendRequests.map((req) => (
                  <div key={req.id} className="flex items-center gap-3">
                    {req.clients?.profile_pic ? (
                      <div className="relative w-10 h-10 rounded-full overflow-hidden">
                        <Image src={req.clients.profile_pic} alt="" fill sizes="40px" className="object-cover" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-700 dark:text-amber-300 font-bold">
                        {(req.clients?.display_name || "?").charAt(0)}
                      </div>
                    )}
                    <div className="flex-1">
                      <a href={`/client/${req.clients?.username}`} className="text-sm font-semibold text-gray-800 dark:text-gray-200 hover:underline">
                        {req.clients?.display_name || req.clients?.username}
                      </a>
                    </div>
                    <button onClick={() => respondToRequest(req.id, "accept")} className="bg-amber-600 text-white px-3 py-1.5 rounded-lg text-sm">
                      Accept
                    </button>
                    <button onClick={() => respondToRequest(req.id, "decline")} className="bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-lg text-sm">
                      Decline
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "posts" && (
            <>
              {loadingPosts ? (
                <div className="space-y-4">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse"></div>
                        <div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
                      </div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4 animate-pulse"></div>
                      <div className="h-48 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
              ) : myPosts.length === 0 ? (
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-8 text-center text-gray-500 dark:text-gray-400">
                  You haven't posted yet. Go to the{" "}
                  <a href="/feed" className="text-amber-600 dark:text-amber-400 hover:underline font-medium">Public Feed</a>{" "}
                  to share your first post.
                </div>
              ) : (
                myPosts.map((post) => (
                  <PostCard key={post.id} post={post} currentUserId={client.id} currentUserIsOkmade={client.is_okmade} onUpdate={loadMyPosts} />
                ))
              )}
            </>
          )}

          {activeTab === "about" && (
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">About</h2>
              <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                <p><strong>Name:</strong> {fullName}</p>
                <p><strong>Username:</strong> @{client.username}</p>
                {client.email && <p><strong>Email:</strong> {client.email}</p>}
                {client.calling_phone && <p><strong>Phone:</strong> {client.calling_phone}</p>}
                {client.work_address && <p><strong>Location:</strong> {client.work_address}</p>}
                {client.skill && <p><strong>Skill:</strong> {client.skill}</p>}
                {client.age && <p><strong>Age:</strong> {client.age}</p>}
                {client.bio && (
                  <div>
                    <strong>Bio:</strong>
                    <p className="mt-1 text-gray-600 dark:text-gray-400">{client.bio}</p>
                  </div>
                )}
              </div>
              <a href="/client/profile" className="inline-block mt-4 text-amber-600 dark:text-amber-400 hover:underline text-sm">
                Edit Profile →
              </a>
            </div>
          )}

          {activeTab === "projects" && (
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-8 text-center text-gray-500 dark:text-gray-400">
              <p>Your projects list will appear here.</p>
              <p className="text-sm mt-2">(Coming in a later update)</p>
            </div>
          )}

          {activeTab === "reviews" && (
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-8 text-center text-gray-500 dark:text-gray-400">
              <p>Reviews you've received will appear here.</p>
            </div>
          )}

          {activeTab === "photos" && (
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-8 text-center text-gray-500 dark:text-gray-400">
              <p>Your photo gallery will appear here.</p>
            </div>
          )}
        </main>
      </div>

      {logoutConfirm && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4" onClick={() => setLogoutConfirm(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">Log out?</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-5">Are you sure you want to log out of your account?</p>
            <div className="flex gap-3">
              <button onClick={() => setLogoutConfirm(false)} className="flex-1 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium py-2.5 rounded-lg transition">
                Cancel
              </button>
              <button onClick={confirmLogout} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 rounded-lg transition">
                Yes, Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
