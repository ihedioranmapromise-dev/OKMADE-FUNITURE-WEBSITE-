/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["qyvuvcopjkgdugdtiydu.supabase.co"],
  },
  async redirects() {
    return [
      { source: "/admin/projects", destination: "/admin/dashboard?tab=projects", permanent: false },
      { source: "/admin/progress", destination: "/admin/dashboard?tab=progress", permanent: false },
      { source: "/admin/testimonials", destination: "/admin/dashboard?tab=portfolio", permanent: false },
      { source: "/admin/products", destination: "/admin/dashboard?tab=products", permanent: false },
      { source: "/admin/catalogs", destination: "/admin/dashboard?tab=catalogs", permanent: false },
      { source: "/admin/showroom", destination: "/admin/dashboard?tab=showroom", permanent: false },
      { source: "/admin/catalog", destination: "/admin/dashboard?tab=add-catalog", permanent: false },
      { source: "/admin/tokens", destination: "/admin/dashboard?tab=projects", permanent: false },
    ];
  },
};

export default nextConfig;
