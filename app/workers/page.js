"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Navbar from "@/app/components/Navbar";
import SearchInput from "@/app/components/SearchInput";

const BLUR = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxIDEiPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNmZWYzYzciLz48L3N2Zz4=";

const VerifiedBadge = ({ isOkmade }) => (
  <svg
    className={`w-5 h-5 inline-block ml-1 ${isOkmade ? "text-amber-500" : "text-blue-500"}`}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-label="Verified"
  >
    <path d="M12 2l2.09 2.26 3.06-.46.63 3.02 2.81 1.31-1.24 2.83 1.24 2.83-2.81 1.31-.63 3.02-3.06-.46L12 20l-2.09-2.26-3.06.46-.63-3.02L3.41 13.87l1.24-2.83-1.24-2.83 2.81-1.31.63-3.02 3.06.46L12 2z" />
    <path d="M9.5 12.5l1.8 1.8 3.7-3.7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
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
    try {
      const res = await fetch("/api/public/workers");
      if (res.ok) {
        const data = await res.json();
        setWorkers(data);
        setFilteredWorkers(data);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white dark:from-gray-950 dark:to-gray-900 pt-24 pb-12 px-4">
      <Navbar />
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-amber-800 dark:text-amber-400 font-['Dancing_Script',_cursive]">
            Our Artisans
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Discover the skilled hands behind our work.
          </p>
        </div>

        <div className="max-w-md mx-auto mb-10">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search by name, username, or skill..."
            storageKey="okmade_recent_workers"
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-900 rounded-xl shadow-md overflow-hidden border border-amber-100/30 dark:border-gray-800">
                <div className="p-6 text-center">
                  <div className="flex justify-center mb-4">
                    <div className="w-24 h-24 rounded-full bg-amber-100 dark:bg-gray-800 animate-pulse"></div>
                  </div>
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mx-auto animate-pulse"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mx-auto mt-2 animate-pulse"></div>
                  <div className="h-9 bg-gray-100 dark:bg-gray-800 rounded-full mt-4 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredWorkers.length === 0 ? (
          <div className="text-center py-16 text-gray-500 dark:text-gray-400">
            {searchTerm ? "No workers match your search." : "No workers registered yet."}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredWorkers.map((worker, idx) => {
              const displayName =
                worker.display_name ||
                `${worker.first_name || ""} ${worker.last_name || ""}`.trim() ||
                worker.username;
              return (
                <div
                  key={worker.username}
                  className="bg-white dark:bg-gray-900 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-amber-100/30 dark:border-gray-800 hover:-translate-y-1 cursor-pointer"
                  onClick={() => router.push(`/client/${worker.username}`)}
                >
                  <div className="p-6 text-center">
                    <div className="flex justify-center mb-4">
                      {worker.profile_pic ? (
                        <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-amber-200 dark:border-amber-800">
                          <Image
                            src={worker.profile_pic}
                            alt={displayName}
                            fill
                            sizes="96px"
                            className="object-cover"
                            placeholder="blur"
                            blurDataURL={BLUR}
                            priority={idx < 6}
                          />
                        </div>
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-700 dark:text-amber-300 text-3xl font-bold border-4 border-amber-200 dark:border-amber-800">
                          {(displayName || "?").charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 flex items-center justify-center">
                      {displayName}
                      {(worker.is_okmade || worker.verified) && (
                        <VerifiedBadge isOkmade={worker.is_okmade} />
                      )}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">@{worker.username}</p>
                    {worker.skill && (
                      <p className="text-sm text-amber-600 dark:text-amber-400 font-medium mt-1">
                        {worker.skill}
                      </p>
                    )}
                    {worker.bio && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                        {worker.bio}
                      </p>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/client/${worker.username}`);
                      }}
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
