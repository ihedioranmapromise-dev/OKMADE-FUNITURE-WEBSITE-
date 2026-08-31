"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function WorkersDirectory() {
  const [workers, setWorkers] = useState([]);
  const [filteredWorkers, setFilteredWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetchWorkers();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredWorkers(workers);
    } else {
      const term = searchTerm.toLowerCase().trim();
      const filtered = workers.filter((w) => {
        const displayName = (w.display_name || w.username || "").toLowerCase();
        const username = (w.username || "").toLowerCase();
        const firstName = (w.first_name || "").toLowerCase();
        const lastName = (w.last_name || "").toLowerCase();
        const skill = (w.skill || "").toLowerCase();

        return (
          displayName.includes(term) ||
          username.includes(term) ||
          firstName.includes(term) ||
          lastName.includes(term) ||
          skill.includes(term)
        );
      });
      setFilteredWorkers(filtered);
    }
  }, [searchTerm, workers]);

  async function fetchWorkers() {
    setLoading(true);
    const { data, error } = await supabase
      .from("clients")
      .select("id, username, display_name, first_name, last_name, profile_pic, skill, work_address, bio")
      .order("display_name", { ascending: true });
    if (!error) {
      setWorkers(data || []);
      setFilteredWorkers(data || []);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-amber-800 font-['Dancing_Script',_cursive]">
            Our Artisans
          </h1>
          <p className="text-gray-600 mt-2">Discover the skilled hands behind our work.</p>
        </div>

        {/* Search Bar */}
        <div className="max-w-md mx-auto mb-10">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name, username, or skill..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-4 pl-12 border border-amber-200/50 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-300 bg-white/80 backdrop-blur-sm transition"
            />
            <svg
              className="absolute left-4 top-4 h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Workers Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-pulse text-amber-600">Loading artisans...</div>
          </div>
        ) : filteredWorkers.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            {searchTerm ? "No workers match your search." : "No workers registered yet."}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredWorkers.map((worker) => {
              const displayName = worker.display_name ||
                `${worker.first_name || ""} ${worker.last_name || ""}`.trim() ||
                worker.username;
              return (
                <div
                  key={worker.id}
                  className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-amber-100/30 hover:-translate-y-1 cursor-pointer"
                  onClick={() => router.push(`/client/${worker.username}`)}
                >
                  <div className="p-6 text-center">
                    <div className="flex justify-center mb-4">
                      {worker.profile_pic ? (
                        <img
                          src={worker.profile_pic}
                          className="w-24 h-24 rounded-full object-cover border-4 border-amber-200"
                          alt={displayName}
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-3xl border-4 border-amber-200">
                          👤
                        </div>
                      )}
                    </div>
                    <h2 className="text-xl font-semibold text-gray-800">{displayName}</h2>
                    <p className="text-sm text-gray-500">@{worker.username}</p>
                    {worker.skill && (
                      <p className="text-sm text-amber-600 font-medium mt-1">{worker.skill}</p>
                    )}
                    {worker.bio && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">{worker.bio}</p>
                    )}
                    <button
                      onClick={() => router.push(`/client/${worker.username}`)}
                      className="mt-4 bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded-full text-sm transition"
                    >
                      View Profile
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}