import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://okmade.vercel.app";

function escapeXml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  let projects = [];
  try {
    const { data } = await supabase
      .from("projects")
      .select("id, token_string, work_description, city, project_details, created_at")
      .eq("status", "killed")
      .order("created_at", { ascending: false })
      .limit(30);
    projects = data || [];
  } catch {}

  const items = projects
    .map(
      (p) => `
    <item>
      <title>${escapeXml(p.work_description || "Completed Project")}</title>
      <link>${BASE_URL}/workspace/${escapeXml(p.token_string || p.id)}</link>
      <guid isPermaLink="true">${BASE_URL}/workspace/${escapeXml(p.token_string || p.id)}</guid>
      <pubDate>${new Date(p.created_at).toUTCString()}</pubDate>
      ${p.city ? `<category>${escapeXml(p.city)}</category>` : ""}
      <description>${escapeXml(
        (p.project_details || p.work_description || "").slice(0, 300)
      )}</description>
    </item>`
    )
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>OKMADE Furniture &amp; Interiors</title>
    <link>${BASE_URL}</link>
    <description>Handcrafted furniture and interior fit-outs from Aba, Nigeria.</description>
    <language>en-ng</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${BASE_URL}/rss.xml" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
