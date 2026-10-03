"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import Navbar from "@/app/components/Navbar";
import PostCard from "@/app/components/PostCard";
import PostComposer from "@/app/components/PostComposer";

const FeedIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h10" />
  </svg>
);
const HomeIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);
const DashboardIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zm0 6a1 1 0 011-1h4a1 1 0 011 1v8a1 1 0 01-1 1h-4a1 1 0 01-1-1v-8zM4 14a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1v-5z" />
  </svg>
);
const MessageIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);
const BellIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);
const CogIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
const LogoutIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);
const PlusIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);
const MenuIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);
const CloseIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export default function FeedPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowser();
  const [user, setUser] = useState(null);
  const [client, setClient] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [tab, setTab] = useState("for-you");
  const [allPosts, setAllPosts] = useState([]);
  const [followingPosts, setFollowingPosts] = useState([]);
  const [stories, setStories] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [composerOpen, setComposerOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const storyScrollRef = useRef(null);

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/client/login"); return; }
      setUser(user);

      const { data: c } = await supabase
        .from("clients")
        .select("id, username, display_name, profile_pic")
        .eq("auth_id", user.id)
        .maybeSingle();
      setClient(c || null);
      setAuthChecked(true);
    }
    check();
  }, [router, supabase]);

  const loadPosts = async () => {
    setLoadingPosts(true);
    const res = await fetch("/api/posts");
    if (res.ok) {
      const data = await res.json();
      setAllPosts(Array.isArray(data) ? data : []);
    }
    setLoadingPosts(false);
  };

  const loadFollowingPosts = async () => {
    if (!client) return;
    const res = await fetch("/api/follows");
    if (!res.ok) return;
    const data = await res.json();
    const followedUsernames = new Set(
      (data.following || []).map((f) => f.username || f.following_username || f.client_username).filter(Boolean)
    );
    const filtered = allPosts.filter((p) => followedUsernames.has(p.author_username || p.clients?.username));
    setFollowingPosts(filtered);
  };

  const loadStories = async () => {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data } = await supabase
      .from("client_posts")
      .select("id, client_id, image_url, created_at, clients:client_id (username, display_name, profile_pic)")
      .gte("created_at", since)
      .order("created_at", { ascending: false });
    setStories(data || []);
  };

  useEffect(() => {
    if (authChecked) {
      loadPosts();
      loadStories();
    }
  }, [authChecked]);

  useEffect(() => {
    if (authChecked && tab === "following") {
      loadFollowingPosts();
    }
  }, [tab, allPosts, client, authChecked]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-50 to-white">
        <div className="text-amber-600 animate-pulse">Loading feed...</div>
      </div>
    );
  }

  const posts = tab === "for-you" ? allPosts : followingPosts;

  return (
    <div className="min-h-screen bg-gray-100 pt-16 pb-32">
      <Navbar />

      {/* Stories bar */}
      <div className="bg-white border-b border-gray-200 py-3">
        <div ref={storyScrollRef} className="flex gap-3 overflow-x-auto px-4 no-scrollbar">
          {client && (
            <button
              onClick={() => setComposerOpen(true)}
              className="flex flex-col items-center gap-1 flex-shrink-0"
              aria-label="Add story"
            >
              <div className="relative w-16 h-16 rounded-full border-2 border-dashed border-amber-400 flex items-center justify-center bg-amber-50">
                {client.profile_pic ? (
                  <img src={client.profile_pic} alt="" className="w-full h-full rounded-full object-cover opacity-70" />
                ) : (
                  <div className="w-full h-full rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold">
                    {(client.display_name || client.username || "?").charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 bg-amber-600 text-white rounded-full w-6 h-6 flex items-center justify-center border-2 border-white">
                  <PlusIcon className="w-3.5 h-3.5" />
                </div>
              </div>
              <span className="text-xs text-gray-600 truncate w-16 text-center">Your story</span>
            </button>
          )}

          {stories.length === 0 ? (
            <div className="flex items-center text-sm text-gray-400 px-2 py-4">
              No stories yet today.
            </div>
          ) : (
            stories.map((s) => {
              const owner = s.clients || {};
              const name = owner.display_name || owner.username || "Artisan";
              return (
                <a
                  key={s.id}
                  href={`/client/${owner.username || ""}`}
                  className="flex flex-col items-center gap-1 flex-shrink-0"
                >
                  <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-amber-500 via-orange-400 to-amber-600">
                    {owner.profile_pic ? (
                      <img src={owner.profile_pic} alt={name} className="w-full h-full rounded-full object-cover border-2 border-white" />
                    ) : (
                      <div className="w-full h-full rounded-full bg-amber-100 border-2 border-white flex items-center justify-center text-amber-700 font-bold">
                        {name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-gray-600 truncate w-16 text-center">
                    {name.split(" ")[0]}
                  </span>
                </a>
              );
            })
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-30">
        <div className="max-w-2xl mx-auto flex">
          <button
            onClick={() => setTab("for-you")}
            className={`flex-1 py-3 text-sm font-semibold border-b-2 transition ${tab === "for-you" ? "border-amber-600 text-amber-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          >
            For You
          </button>
          <button
            onClick={() => setTab("following")}
            className={`flex-1 py-3 text-sm font-semibold border-b-2 transition ${tab === "following" ? "border-amber-600 text-amber-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          >
            Following
          </button>
        </div>
      </div>

      {/* Inline composer */}
      <div className="max-w-2xl mx-auto px-4 pt-4">
        <PostComposer onPosted={loadPosts} />
      </div>

      {/* Posts */}
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {loadingPosts ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
            Loading posts...
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
            {tab === "following"
              ? "No posts from people you follow yet. Follow some artisans to see their work here."
              : "No posts yet. Be the first to share!"}
          </div>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={client?.id || null}
              onUpdate={loadPosts}
            />
          ))
        )}
      </div>

      {/* Floating buttons */}
      <div className="fixed bottom-6 right-4 z-40 flex flex-col gap-3">
        <button
          onClick={() => setComposerOpen(true)}
          className="w-14 h-14 rounded-full bg-amber-600 hover:bg-amber-700 text-white shadow-lg hover:shadow-xl flex items-center justify-center transition"
          aria-label="Compose post"
        >
          <PlusIcon className="w-6 h-6" />
        </button>
        <button
          onClick={() => setDrawerOpen(true)}
          className="w-12 h-12 rounded-full bg-white hover:bg-gray-50 text-gray-700 shadow-lg border border-gray-200 flex items-center justify-center transition"
          aria-label="Open menu"
        >
          <MenuIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Composer popup */}
      {composerOpen && (
        <div
          className="fixed inset-0 z-[80] bg-black/60 flex items-end md:items-center justify-center p-0 md:p-4"
          onClick={() => setComposerOpen(false)}
        >
          <div
            className="bg-white w-full md:max-w-lg md:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <h3 className="font-bold text-gray-800">Create Post</h3>
              <button
                onClick={() => setComposerOpen(false)}
                className="p-1.5 hover:bg-gray-100 rounded-full transition"
                aria-label="Close composer"
              >
                <CloseIcon />
              </button>
            </div>
            <div className="p-4">
              <PostComposer
                onPosted={() => {
                  setComposerOpen(false);
                  loadPosts();
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[90]" onClick={() => setDrawerOpen(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="absolute top-0 right-0 h-full w-72 max-w-[80vw] bg-white shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
              <span className="font-bold text-amber-800 font-['Dancing_Script',_cursive] text-xl">OKMADE</span>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1.5 hover:bg-gray-100 rounded-full transition"
                aria-label="Close menu"
              >
                <CloseIcon />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto py-2">
              <a href="/feed" onClick={() => setDrawerOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-amber-50 text-amber-700 font-semibold text-sm">
                <FeedIcon /> Public Feed
              </a>
              <a href="/client/dashboard" onClick={() => setDrawerOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-amber-50 text-gray-700 text-sm">
                <DashboardIcon /> Dashboard
              </a>
              <a href="/client/messages" onClick={() => setDrawerOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-amber-50 text-gray-700 text-sm">
                <MessageIcon /> Messages
              </a>
              <a href="/client/notifications" onClick={() => setDrawerOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-amber-50 text-gray-700 text-sm">
                <BellIcon /> Notifications
              </a>
              {client && (
                <a href={`/client/${client.username}`} onClick={() => setDrawerOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-amber-50 text-gray-700 text-sm">
                  <HomeIcon /> My Public Profile
                </a>
              )}
              <a href="/client/settings" onClick={() => setDrawerOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-amber-50 text-gray-700 text-sm">
                <CogIcon /> Settings
              </a>
            </nav>
            <div className="border-t border-gray-200">
              <button
                onClick={() => { setDrawerOpen(false); setLogoutConfirm(true); }}
                className="w-full flex items-center gap-3 px-4 py-4 hover:bg-red-50 text-red-600 text-sm text-left"
              >
                <LogoutIcon /> Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout confirm */}
      {logoutConfirm && (
        <div
          className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4"
          onClick={() => setLogoutConfirm(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-800 mb-2">Log out?</h3>
            <p className="text-gray-600 text-sm mb-5">
              Are you sure you want to log out of your account?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setLogoutConfirm(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2.5 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 rounded-lg transition"
              >
                Yes, Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
