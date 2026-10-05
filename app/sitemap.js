import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://okmade.vercel.app";

export default async function sitemap() {
  const staticPages = [
    { url: `${BASE_URL}/`, changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE_URL}/portfolio`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/showroom`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/catalog`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/workers`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/terms`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE_URL}/privacy`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE_URL}/faq`, changeFrequency: "monthly", priority: 0.4 },
  ];

  let dynamicPages = [];

  try {
    const [projectsRes, productsRes, catalogsRes, workersRes] = await Promise.all([
      supabase
        .from("projects")
        .select("token_string, id, created_at")
        .eq("status", "killed")
        .order("created_at", { ascending: false })
        .limit(500),
      supabase
        .from("showroom")
        .select("id, created_at")
        .order("created_at", { ascending: false })
        .limit(500),
      supabase
        .from("catalogs")
        .select("id, created_at")
        .order("created_at", { ascending: false })
        .limit(500),
      supabase
        .from("clients")
        .select("username, created_at")
        .order("created_at", { ascending: false })
        .limit(500),
    ]);

    (projectsRes.data || []).forEach((p) => {
      dynamicPages.push({
        url: `${BASE_URL}/workspace/${p.token_string || p.id}`,
        lastModified: p.created_at ? new Date(p.created_at) : undefined,
        changeFrequency: "monthly",
        priority: 0.7,
      });
    });

    (productsRes.data || []).forEach((p) => {
      dynamicPages.push({
        url: `${BASE_URL}/product/${p.id}`,
        lastModified: p.created_at ? new Date(p.created_at) : undefined,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    });

    (workersRes.data || []).forEach((w) => {
      dynamicPages.push({
        url: `${BASE_URL}/client/${w.username}`,
        lastModified: w.created_at ? new Date(w.created_at) : undefined,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    });

    // Catalogs list page — dynamic ones not needed, list page covers them
  } catch (err) {
    // Sitemap must never fail the build
  }

  return [...staticPages, ...dynamicPages];
}
