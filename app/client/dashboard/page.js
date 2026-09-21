"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import PostComposer from "@/app/components/PostComposer";
import PostCard from "@/app/components/PostCard";

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
const IconFolder = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
  </svg>
);
const IconCheck = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const IconLogout = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

export default function ClientDashboard() {
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");
  const [error, setError] = useState("");
  const [feed, setFeed] = useState([]);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const router = useRouter();
  const supabase = createSupabaseBrowser();

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/client/me");
      if (res.status === 401) {
        router.push("/client/login");
        return;
      }
      if (!res.ok) {
        setError("Could not load profile.");
        setLoading(false);
        return;
      }
      const data = await res.json();
      setClient(data);
      setLoading(false);
    }
    load();
  }, [router]);

  useEffect(() => {
    if (client) loadFeed();
  }, [client]);

  async function loadFeed() {
    setLoadingFeed(true);
    const res = await fetch("/api/posts");
    if (res.ok) setFeed(await res.json());
    setLoadingFeed(false);
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-50 to-white">
        <div className="text-amber-600 animate-pulse text-lg">Loading your profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-50 to-white">
        <div className="text-red-600 text-lg">{error}</div>
      </div>
    );
  }

  const fullName = client.display_name || `${client.first_name || ""} ${client.last_name || ""}`.trim() || client.username;

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <img src="/favicon.ico" alt="OKMADE" className="w-8 h-8 object-contain" />
            <span className="text-xl font-bold text-amber-800 font-['Dancing_Script',_cursive]">OKMADE</span>
          </a>
          <div className="relative">
            <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 hover:bg-gray-100 rounded-full transition">
              <IconMenu />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                  <a href="/" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-amber-50 text-gray-700 text-sm">
                    <IconHome /> Home
                  </a>
                  <button onClick={() => { setActiveTab("projects"); setMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-amber-50 text-gray-700 text-sm text-left">
                    <IconFolder /> Active Projects
                  </button>
                  <button onClick={() => { setActiveTab("projects"); setMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-amber-50 text-gray-700 text-sm text-left">
                    <IconCheck /> Completed
                  </button>
                  <div className="border-t" />
                  <a href={`/client/${client.username}`} onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-amber-50 text-gray-700 text-sm">
                    <IconUser /> View Public Profile
                  </a>
                  <a href="/client/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-amber-50 text-gray-700 text-sm">
                    <IconEdit /> Edit Profile
                  </a>
                  <a href="/client/settings" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-amber-50 text-gray-700 text-sm">
                    Settings
                  </a>
                  <div className="border-t" />
                  <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 text-red-600 text-sm text-left">
                    <IconLogout /> Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Cover + Profile Header */}
      <div className="relative">
        <div className="relative h-40 md:h-64 bg-gradient-to-r from-amber-700 to-stone-700">
          {client.cover_photo && (
            <img src={client.cover_photo} className="w-full h-full object-cover" alt="Cover" />
          )}
        </div>

        <div className="max-w-5xl mx-auto px-4 relative">
          <div className="-mt-16 md:-mt-20 flex flex-col md:flex-row md:items-end md:gap-6">
            <div className="relative">
              {client.profile_pic ? (
                <img src={client.profile_pic} className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-white shadow-lg" alt="Profile" />
              ) : (
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gray-300 flex items-center justify-center text-gray-500 border-4 border-white shadow-lg text-5xl font-bold">
                  {fullName.charAt(0).toUpperCase()}
                </div>
              )}
              <a href="/client/profile" className="absolute bottom-2 right-2 bg-white hover:bg-amber-50 rounded-full p-2 shadow border border-gray-200 transition" title="Change profile picture">
                <IconCamera className="w-4 h-4 text-gray-700" />
              </a>
            </div>

            <div className="mt-3 md:mt-0 md:pb-4 flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{fullName}</h1>
              <p className="text-sm text-gray-600">
                @{client.username}
                {client.skill && ` · ${client.skill}`}
                {client.work_address && ` · ${client.work_address}`}
              </p>
              {client.age && <p className="text-xs text-gray-500 mt-1">Age: {client.age}</p>}
            </div>

            <div className="mt-3 md:mt-0 md:pb-4 flex gap-2">
              <a href={`/client/${client.username}`} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg text-sm font-medium transition">
                View Public
              </a>
              <a href="/client/profile" className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition">
                Edit Profile
              </a>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-4 border-t border-gray-200">
            <div className="flex gap-1 md:gap-2 overflow-x-auto">
              {[
                { id: "posts", label: "Posts" },
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
                      ? "border-amber-600 text-amber-700"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <aside className="hidden lg:block space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-800 mb-3">Intro</h3>
            {client.bio ? (
              <p className="text-sm text-gray-700">{client.bio}</p>
            ) : (
              <p className="text-sm text-gray-500 italic">No bio yet</p>
            )}
            <a href="/client/profile" className="block text-center mt-3 text-sm text-amber-600 hover:underline">
              Edit bio
            </a>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-800 mb-3">Details</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              {client.skill && <li><span className="text-gray-400">Skill:</span> {client.skill}</li>}
              {client.work_address && <li><span className="text-gray-400">Location:</span> {client.work_address}</li>}
              {client.calling_phone && <li><span className="text-gray-400">Phone:</span> {client.calling_phone}</li>}
              {client.age && <li><span className="text-gray-400">Age:</span> {client.age}</li>}
            </ul>
          </div>
        </aside>

        <main className="lg:col-span-2 space-y-4">
          {activeTab === "posts" && (
            <>
              <PostComposer onPosted={loadFeed} />
              {loadingFeed ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
                  Loading feed...
                </div>
              ) : feed.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
                  No posts yet. Be the first to share!
                </div>
              ) : (
                feed.map((post) => (
                  <PostCard key={post.id} post={post} currentUserId={client.id} onUpdate={loadFeed} />
                ))
              )}
            </>
          )}

          {activeTab === "about" && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4">About</h2>
              <div className="space-y-3 text-sm text-gray-700">
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
                    <p className="mt-1 text-gray-600">{client.bio}</p>
                  </div>
                )}
              </div>
              <a href="/client/profile" className="inline-block mt-4 text-amber-600 hover:underline text-sm">
                Edit Profile →
              </a>
            </div>
          )}

          {activeTab === "projects" && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
              <p>Your projects list will appear here.</p>
              <p className="text-sm mt-2">(Coming in a later update)</p>
            </div>
          )}

          {activeTab === "reviews" && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
              <p>Reviews you've received will appear here.</p>
            </div>
          )}

          {activeTab === "photos" && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
              <p>Your photo gallery will appear here.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
