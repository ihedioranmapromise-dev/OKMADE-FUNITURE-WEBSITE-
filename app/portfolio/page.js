"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Navbar from "@/app/components/Navbar";
import SearchInput from "@/app/components/SearchInput";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const BLUR = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxIDEiPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNmZWYzYzciLz48L3N2Zz4=";

export default function PortfolioPage() {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(9);
  const [stats, setStats] = useState({ totalProjects: 0, totalCities: 0, totalCategories: 0, totalClients: 0 });
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let filtered = projects;
    if (selectedCategory) filtered = filtered.filter((p) => p.category_id === selectedCategory);
    if (selectedCity) filtered = filtered.filter((p) => p.city === selectedCity);
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter((p) => {
        const title = (p.work_description || "").toLowerCase();
        const city = (p.city || "").toLowerCase();
        const details = (p.project_details || "").toLowerCase();
        return title.includes(term) || city.includes(term) || details.includes(term);
      });
    }
    setFilteredProjects(filtered);
    setVisibleCount(9);
  }, [selectedCategory, selectedCity, searchTerm, projects]);

  async function fetchData() {
    setLoading(true);
    const [catsRes, projsRes] = await Promise.all([
      supabase.from("categories").select("*").order("name"),
      supabase.from("projects").select("id, token_string, work_description, city, duration_weeks, project_details, category_id, created_at, is_standalone, categories(name)").eq("status", "killed").order("created_at", { ascending: false }),
    ]);

    setCategories(catsRes.data || []);

    const projs = projsRes.data;
    if (projsRes.error || !projs || projs.length === 0) {
      setProjects([]);
      setFilteredProjects([]);
      setLoading(false);
      return;
    }

    const ids = projs.map((p) => p.id);
    const { data: allImgs } = await supabase
      .from("project_request_images")
      .select("project_id, image_url, display_order")
      .in("project_id", ids)
      .order("display_order", { ascending: true });

    const firstImageByProject = {};
    (allImgs || []).forEach((img) => {
      if (!firstImageByProject[img.project_id]) firstImageByProject[img.project_id] = img.image_url;
    });

    const projectsWithImages = projs.map((p) => ({ ...p, coverImage: firstImageByProject[p.id] || null }));
    setProjects(projectsWithImages);
    setFilteredProjects(projectsWithImages);

    const uniqueCities = new Set(projs.map((p) => p.city).filter(Boolean));
    const uniqueCategories = new Set(projs.map((p) => p.category_id).filter(Boolean));
    const uniqueClients = new Set(projs.filter((p) => !p.is_standalone).map((p) => p.token_string));
    setStats({
      totalProjects: projs.length,
      totalCities: uniqueCities.size,
      totalCategories: uniqueCategories.size,
      totalClients: uniqueClients.size,
    });
    setCities([...uniqueCities].sort());
    setLoading(false);
  }

  const loadMore = () => setVisibleCount((prev) => prev + 9);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white dark:from-gray-950 dark:to-gray-900 pt-16">
      <Navbar />

      <section className="relative h-[500px] flex items-center justify-center overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=2070&q=80"
          alt="Our Portfolio"
          fill
          priority
          sizes="100vw"
          className="object-cover"
          placeholder="blur"
          blurDataURL={BLUR}
        />
        <div className="absolute inset-0 bg-black/60"></div>
        <div className="relative z-10 text-center text-white px-6 max-w-3xl">
          <p className="text-sm md:text-base tracking-[0.3em] uppercase text-amber-200 mb-4">Our Portfolio</p>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 font-['Dancing_Script',_cursive] text-amber-200 drop-shadow-lg">
            Where Wood Meets Artistry
          </h1>
          <p className="text-lg md:text-xl leading-relaxed text-white/90">
            Explore the spaces we've transformed – from hotels, churches, and government houses to private homes and corporate offices.
          </p>
        </div>
      </section>

      <section className="bg-gradient-to-r from-amber-900 to-stone-800 dark:from-black dark:to-gray-900 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-4xl md:text-5xl font-bold text-amber-300">{stats.totalProjects}+</p>
              <p className="text-sm md:text-base mt-2 text-amber-100/80">Projects Completed</p>
            </div>
            <div className="text-center">
              <p className="text-4xl md:text-5xl font-bold text-amber-300">{stats.totalClients}+</p>
              <p className="text-sm md:text-base mt-2 text-amber-100/80">Happy Clients</p>
            </div>
            <div className="text-center">
              <p className="text-4xl md:text-5xl font-bold text-amber-300">{stats.totalCities}+</p>
              <p className="text-sm md:text-base mt-2 text-amber-100/80">Cities Reached</p>
            </div>
            <div className="text-center">
              <p className="text-4xl md:text-5xl font-bold text-amber-300">{stats.totalCategories}+</p>
              <p className="text-sm md:text-base mt-2 text-amber-100/80">Categories Served</p>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-6 pt-10">
        <div className="max-w-2xl mx-auto">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search projects by name, city, or keyword..."
            storageKey="okmade_recent_portfolio"
          />
        </div>
      </section>

      <section className="container mx-auto px-6 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-wrap gap-4 justify-center items-center">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Filter by Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-3 border border-amber-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Filter by City</label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full p-3 border border-amber-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
              >
                <option value="">All Cities</option>
                {cities.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-6 pb-16">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl shadow-md overflow-hidden border border-amber-100/30 dark:border-gray-800">
                <div className="h-64 bg-amber-50 dark:bg-gray-800 animate-pulse"></div>
                <div className="p-5 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-16 text-gray-500 dark:text-gray-400 text-lg">
            No projects match your filters. Try adjusting your search.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProjects.slice(0, visibleCount).map((project, idx) => (
                <div
                  key={project.id}
                  onClick={() => router.push(`/workspace/${project.token_string || project.id}`)}
                  className="group bg-white dark:bg-gray-900 rounded-2xl shadow-md overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer border border-amber-100/30 dark:border-gray-800 hover:-translate-y-2"
                >
                  <div className="relative h-64 overflow-hidden bg-amber-50 dark:bg-gray-800">
                    {project.coverImage ? (
                      <Image
                        src={project.coverImage}
                        alt={project.work_description || "Project"}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover group-hover:scale-110 transition duration-700"
                        placeholder="blur"
                        blurDataURL={BLUR}
                        priority={idx < 3}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-amber-300 dark:text-gray-600">No image</div>
                    )}
                    {project.categories?.name && (
                      <div className="absolute top-4 left-4 bg-amber-700/90 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full shadow-lg z-10">
                        {project.categories.name}
                      </div>
                    )}
                    {project.token_string && (
                      <div className="absolute top-4 right-4 bg-black/50 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm font-mono z-10">
                        #{project.token_string}
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2 line-clamp-2">
                      {project.work_description || "Untitled Project"}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      {project.city && (
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {project.city}
                        </span>
                      )}
                      {project.duration_weeks && (
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {project.duration_weeks} weeks
                        </span>
                      )}
                    </div>
                    <div className="mt-4">
                      <span className="text-amber-600 dark:text-amber-400 font-medium text-sm group-hover:underline">
                        View Case Study →
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {visibleCount < filteredProjects.length && (
              <div className="text-center mt-14">
                <button onClick={loadMore} className="bg-amber-600 hover:bg-amber-700 text-white font-semibold px-8 py-3 rounded-full transition shadow-lg hover:shadow-xl">
                  Load More Projects
                </button>
              </div>
            )}
          </>
        )}
      </section>

      <section className="bg-gradient-to-r from-amber-900 to-stone-800 dark:from-black dark:to-gray-900 py-16">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-amber-200 mb-4 font-['Dancing_Script',_cursive]">
            Ready to Create Your Own Masterpiece?
          </h2>
          <p className="text-white/80 max-w-2xl mx-auto mb-8">
            Let's transform your space with timeless furniture and interiors.
          </p>
          <a href="/#contact" className="inline-block bg-amber-600 hover:bg-amber-700 text-white font-semibold px-8 py-3 rounded-full transition shadow-lg hover:shadow-xl">
            Contact Us
          </a>
        </div>
      </section>
    </div>
  );
}
