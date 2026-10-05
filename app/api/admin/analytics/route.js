import { createClient } from "@supabase/supabase-js";
import { isAdmin, unauthorized, serverError } from "@/lib/admin-guard";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  if (!(await isAdmin(request))) return unauthorized();
  try {
    const { searchParams } = new URL(request.url);
    const days = Math.min(90, Math.max(1, parseInt(searchParams.get("days") || "7", 10)));
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const [visitsRes, searchesRes] = await Promise.all([
      admin
        .from("page_visits")
        .select("path, referrer, ip_hash, created_at")
        .gte("created_at", since),
      admin
        .from("search_queries")
        .select("query, section, created_at")
        .gte("created_at", since),
    ]);

    const visits = visitsRes.data || [];
    const searches = searchesRes.data || [];

    const uniqueVisitors = new Set(visits.map((v) => v.ip_hash).filter(Boolean)).size;

    const byPath = {};
    visits.forEach((v) => {
      byPath[v.path] = (byPath[v.path] || 0) + 1;
    });
    const topPaths = Object.entries(byPath)
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    const byReferrer = {};
    visits.forEach((v) => {
      const ref = v.referrer || "direct";
      let key = "direct";
      try {
        if (v.referrer) {
          const url = new URL(v.referrer);
          key = url.hostname;
        }
      } catch {}
      byReferrer[key] = (byReferrer[key] || 0) + 1;
    });
    const topReferrers = Object.entries(byReferrer)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const byDay = {};
    visits.forEach((v) => {
      const day = v.created_at.slice(0, 10);
      byDay[day] = (byDay[day] || 0) + 1;
    });
    const timeline = Object.entries(byDay)
      .map(([day, count]) => ({ day, count }))
      .sort((a, b) => a.day.localeCompare(b.day));

    const byQuery = {};
    searches.forEach((s) => {
      const q = (s.query || "").toLowerCase().trim();
      if (!q) return;
      byQuery[q] = (byQuery[q] || 0) + 1;
    });
    const topSearches = Object.entries(byQuery)
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    return new Response(
      JSON.stringify({
        days,
        totalVisits: visits.length,
        uniqueVisitors,
        topPaths,
        topReferrers,
        timeline,
        topSearches,
        totalSearches: searches.length,
      }),
      { status: 200 }
    );
  } catch (err) {
    return serverError(err.message);
  }
}
