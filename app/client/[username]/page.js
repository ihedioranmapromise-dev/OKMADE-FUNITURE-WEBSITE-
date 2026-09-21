"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useParams, useRouter } from "next/navigation";
import { LocationIcon, PhoneIcon } from "@/lib/icons";
import PostCard from "@/app/components/PostCard";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const UserIcon = () => (
  <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
  </svg>
);

const SocialIcon = ({ href, children }) => {
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="inline-block w-10 h-10 p-2 bg-gray-200 rounded-full hover:bg-gray-300 transition">
      {children}
    </a>
  );
};

export default function ClientPortfolio() {
  const { username } = useParams();
  const router = useRouter();
  const [client, setClient] = useState(null);
  const [projects, setProjects] = useState([]);
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const res = await fetch(`/api/public/worker/${username}/full`);
      if (!res.ok) { setLoading(false); return; }
      const data = await res.json();
      setClient(data.client);
      setProjects(data.projects || []);
      setLoading(false);
    }
    fetchData();
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
    }
    if (username) loadStatus();
  }, [username]);

  const refreshStatus = async () => {
    const res = await fetch(`/api/profile-status?username=${username}`);
    if (res.ok) setStatus(await res.json());
  };

  const handleFollow = async () => {
    if (!status?.isLoggedIn) { window.location.href = "/client/login"; return; }
    setBusy(true);
    await fetch("/api/follows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target_username: username }),
    });
    await refreshStatus();
    setBusy(false);
  };

  const handleFriend = async () => {
    if (!status?.isLoggedIn) { window.location.href = "/client/login"; return; }
    setBusy(true);
    await fetch("/api/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "send", target_username: username }),
    });
    await refreshStatus();
    setBusy(false);
  };

  const handleMessage = async () => {
    if (!status?.isLoggedIn) { window.location.href = "/client/login"; return; }
    setBusy(true);
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });
    const data = await res.json();
    setBusy(false);
    if (data.thread_id) {
      router.push(`/client/messages/${data.thread_id}`);
    } else if (data.error) {
      alert(data.error);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading portfolio...</div>;
  if (!client) return <div className="p-8 text-center text-red-600">Client not found.</div>;

  const st = status || { isLoggedIn: false, isFollowing: false, friendStatus: "none", followersCount: 0, followingCount: 0 };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Cover + Header Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="relative h-40 md:h-56 bg-gradient-to-r from-amber-700 to-stone-700">
            {client.cover_photo && <img src={client.cover_photo} className="w-full h-full object-cover" alt="Cover" />}
          </div>
          <div className="px-6 relative">
            <div className="-mt-16 flex flex-col md:flex-row md:items-end md:gap-6">
              {client.profile_pic ? (
                <img src={client.profile_pic} className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg" alt="Profile" />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 border-4 border-white shadow-lg">
                  <UserIcon />
                </div>
              )}
              <div className="mt-3 md:mt-0 md:pb-4 flex-1">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  {client.display_name || client.username}
                  {client.is_okmade && <span className="ml-2 text-amber-500 text-base">✓</span>}
                </h1>
                <p className="text-sm text-gray-600">
                  @{client.username}
                  {client.skill && ` · ${client.skill}`}
                  {client.work_address && ` · ${client.work_address}`}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  <strong>{st.followersCount}</strong> followers · <strong>{st.followingCount}</strong> following
                </p>
              </div>
              <div className="mt-3 md:mt-0 md:pb-4 flex gap-2 flex-wrap">
                {!st.isSelf && (
                  <>
                    {st.friendStatus === "friends" ? (
                      <button disabled className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium cursor-default">
                        ✓ Friends
                      </button>
                    ) : st.friendStatus === "pending" ? (
                      <button disabled className="bg-gray-100 text-gray-500 px-4 py-2 rounded-lg text-sm font-medium cursor-default">
                        {st.requestDirection === "sent" ? "Request Sent" : "Respond in Requests"}
                      </button>
                    ) : (
                      <button onClick={handleFriend} disabled={busy} className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50">
                        + Add Friend
                      </button>
                    )}
                    <button onClick={handleFollow} disabled={busy} className={`px-4 py-2 rounded-lg text-sm font-semibold transition border ${st.isFollowing ? "bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200" : "bg-white border-amber-500 text-amber-700 hover:bg-amber-50"}`}>
                      {st.isFollowing ? "Following" : "+ Follow"}
                    </button>
                    {st.friendStatus === "friends" && (
                      <button onClick={handleMessage} disabled={busy} className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50">
                        💬 Message
                      </button>
                    )}
                  </>
                )}
                {st.isSelf && (
                  <a href="/client/profile" className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-semibold">
                    Edit Profile
                  </a>
                )}
              </div>
            </div>

            {/* Bio */}
            {client.bio && <p className="text-sm text-gray-700 mt-4 pb-2">{client.bio}</p>}

            {/* Meta row */}
            <div className="flex flex-wrap gap-3 text-xs text-gray-500 py-3 border-t border-gray-100 mt-4">
              {client.work_address && <span className="flex items-center gap-1"><LocationIcon className="w-3 h-3" /> {client.work_address}</span>}
              {client.calling_phone && <span className="flex items-center gap-1"><PhoneIcon className="w-3 h-3" /> {client.calling_phone}</span>}
              {client.age && <span>Age: {client.age}</span>}
            </div>

            {/* Social icons */}
            <div className="flex gap-3 pb-4">
              {client.whatsapp_url && (
                <SocialIcon href={client.whatsapp_url}>
                  <svg viewBox="0 0 24 24" fill="currentColor" className="text-green-600"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                </SocialIcon>
              )}
              {client.facebook_url && (
                <SocialIcon href={client.facebook_url}>
                  <svg viewBox="0 0 24 24" fill="currentColor" className="text-blue-700"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </SocialIcon>
              )}
              {client.tiktok_url && (
                <SocialIcon href={client.tiktok_url}>
                  <svg viewBox="0 0 24 24" fill="currentColor" className="text-black"><path d="M16.6 5.82s.51.5 0 0A4.278 4.278 0 0115.54 3h-3.09v12.4a2.592 2.592 0 01-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-2.84 3.37-2.22V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.89a7.35 7.35 0 002.05.52V7.62c-.75-.05-1.35-.5-1.65-1.2z"/></svg>
                </SocialIcon>
              )}
              {client.instagram_url && (
                <SocialIcon href={client.instagram_url}>
                  <svg viewBox="0 0 24 24" fill="currentColor" className="text-pink-600"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                </SocialIcon>
              )}
            </div>
          </div>
        </div>

        {/* Feed */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3 px-1">Posts</h2>
          {loadingFeed ? (
            <p className="text-gray-500 px-1">Loading posts...</p>
          ) : feed.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
              No posts yet.
            </div>
          ) : (
            <div className="space-y-4">
              {feed.map((post) => (
                <PostCard key={post.id} post={post} currentUserId={status?.myClientId || null} />
              ))}
            </div>
          )}
        </div>

        {/* Completed Projects */}
        {projects.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-3 px-1">Completed Projects</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map((project) => (
                <a key={project.id} href={`/workspace/${project.token_string || project.id}`} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition">
                  <p className="font-semibold text-gray-800">{project.work_description || "Completed Project"}</p>
                  {project.city && <p className="text-xs text-gray-500 mt-1">📍 {project.city}</p>}
                  <p className="text-xs text-gray-500 mt-1">Completed: {new Date(project.created_at).toLocaleDateString()}</p>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
