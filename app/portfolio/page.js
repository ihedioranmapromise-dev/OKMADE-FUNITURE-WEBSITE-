"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { getOptimizedImage } from "@/lib/utils";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

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
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalCities: 0,
    totalCategories: 0,
    totalClients: 0,
  });
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let filtered = projects;
    if (selectedCategory) {
      filtered = filtered.filter((p) => p.category_id === selectedCategory);
    }
    if (selectedCity) {
      filtered = filtered.filter((p) => p.city === selectedCity);
    }
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter((p) => {
        const title = (p.work_description || "").toLowerCase();
        const city = (p.city || "").toLowerCase();
        const details = (p.project_details || "").toLowerCase();
        return (
          title.includes(term) || city.includes(term) || details.includes(term)
        );
      });
    }
    setFilteredProjects(filtered);
    setVisibleCount(9);
  }, [selectedCategory, selectedCity, searchTerm, projects]);

  async function fetchData() {
    setLoading(true);
    const { data: cats } = await supabase
      .from("categories")
      .select("*")
      .order("name");
    setCategories(cats || []);

    const { data: projs, error } = await supabase
      .from("projects")
      .select(
        "id, token_string, work_description, city, duration_weeks, project_details, category_id, created_at, is_standalone, categories(name)"
      )
      .eq("status", "killed")
      .order("created_at", { ascending: false });

    if (!error && projs) {
      const projectsWithImages = await Promise.all(
        projs.map(async (p) => {
          const { data: imgs } = await supabase
            .from("project_request_images")
            .select("image_url")
            .eq("project_id", p.id)
            .order("display_order")
            .limit(1);
          return { ...p, coverImage: imgs?.[0]?.image_url || null };
        })
      );
      setProjects(projectsWithImages);
      setFilteredProjects(projectsWithImages);

      const uniqueCities = new Set(projs.map((p) => p.city).filter(Boolean));
      const uniqueCategories = new Set(
        projs.map((p) => p.category_id).filter(Boolean)
      );
      const uniqueClients = new Set(
        projs.filter((p) => !p.is_standalone).map((p) => p.token_string)
      );
      setStats({
        totalProjects: projs.length,
        totalCities: uniqueCities.size,
        totalCategories: uniqueCategories.size,
        totalClients: uniqueClients.size,
      });
      setCities([...uniqueCities].sort());
    }
    setLoading(false);
  }

  const loadMore = () => setVisibleCount((prev) => prev + 9);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      {/* Hero */}
      <section className="relative h-[500px] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=2070&q=80')",
          }}
        >
          <div className="absolute inset-0 bg-black/60"></div>
        </div>
        <div className="relative z-10 text-center text-white px-6 max-w-3xl">
          <p className="text-sm md:text-base tracking-[0.3em] uppercase text-amber-200 mb-4">
            Our Portfolio
          </p>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 font-['Dancing_Script',_cursive] text-amber-200 drop-shadow-lg">
            Where Wood Meets Artistry
          </h1>
          <p className="text-lg md:text-xl leading-relaxed text-white/90">
            Explore the spaces we've transformed – from hotels, churches, and
            government houses to private homes and corporate offices. Every
            project tells a story of craftsmanship, precision, and passion.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-gradient-to-r from-amber-900 to-stone-800 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-4xl md:text-5xl font-bold text-amber-300">
                {stats.totalProjects}+
              </p>
              <p className="text-sm md:text-base mt-2 text-amber-100/80">
                Projects Completed
              </p>
            </div>
            <div className="text-center">
              <p className="text-4xl md:text-5xl font-bold text-amber-300">
                {stats.totalClients}+
              </p>
              <p className="text-sm md:text-base mt-2 text-amber-100/80">
                Happy Clients
              </p>
            </div>
            <div className="text-center">
              <p className="text-4xl md:text-5xl font-bold text-amber-300">
                {stats.totalCities}+
              </p>
              <p className="text-sm md:text-base mt-2 text-amber-100/80">
                Cities Reached
              </p>
            </div>
            <div className="text-center">
              <p className="text-4xl md:text-5xl font-bold text-amber-300">
                {stats.totalCategories}+
              </p>
              <p className="text-sm md:text-base mt-2 text-amber-100/80">
                Categories Served
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Search Bar */}
      <section className="container mx-auto px-6 pt-10">
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <input
              type="text"
              placeholder="Search projects by name, city, or keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-4 pl-12 border border-amber-200 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-300 bg-white/90 backdrop-blur-sm transition text-sm md:text-base"
            />
            <svg
              className="absolute left-4 top-4 h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="container mx-auto px-6 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-wrap gap-4 justify-center items-center">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-3 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter by City
              </label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full p-3 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500"
              >
                <option value="">All Cities</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Projects */}
      <section className="container mx-auto px-6 pb-16">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-pulse text-amber-600 text-lg">
              Loading portfolio...
            </div>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-16 text-gray-500 text-lg">
            No projects match your filters. Try adjusting your search.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProjects.slice(0, visibleCount).map((project) => (
                <div
                  key={project.id}
                  onClick={() =>
                    router.push(
                      `/workspace/${project.token_string || project.id}`
                    )
                  }
                  className="group bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer border border-amber-100/30 hover:-translate-y-2"
                >
                  <div className="relative h-64 overflow-hidden bg-amber-50">
                    {project.coverImage ? (
                      <img
                        src={getOptimizedImage(project.coverImage, 600)}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-110 transition duration-700"
                        alt={project.work_description}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-amber-300">
                        No image
                      </div>
                    )}
                    {project.categories?.name && (
                      <div className="absolute top-4 left-4 bg-amber-700/90 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full shadow-lg">
                        {project.categories.name}
                      </div>
                    )}
                    {project.token_string && (
                      <div className="absolute top-4 right-4 bg-black/50 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm font-mono">
                        #{project.token_string}
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2">
                      {project.work_description || "Untitled Project"}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      {project.city && (
                        <span className="flex items-center gap-1">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                          {project.city}
                        </span>
                      )}
                      {project.duration_weeks && (
                        <span className="flex items-center gap-1">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          {project.duration_weeks} weeks
                        </span>
                      )}
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-amber-600 font-medium text-sm group-hover:underline">
                        View Case Study →
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {visibleCount < filteredProjects.length && (
              <div className="text-center mt-14">
                <button
                  onClick={loadMore}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-semibold px-8 py-3 rounded-full transition shadow-lg hover:shadow-xl"
                >
                  Load More Projects
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-amber-900 to-stone-800 py-16">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-amber-200 mb-4 font-['Dancing_Script',_cursive]">
            Ready to Create Your Own Masterpiece?
          </h2>
          <p className="text-white/80 max-w-2xl mx-auto mb-8">
            Let's transform your space with timeless furniture and interiors.
            Get in touch with us today to discuss your project.
          </p>
          <a
            href="/#contact"
            className="inline-block bg-amber-600 hover:bg-amber-700 text-white font-semibold px-8 py-3 rounded-full transition shadow-lg hover:shadow-xl"
          >
            Contact Us
          </a>
        </div>
      </section>
    </div>
  );
}
