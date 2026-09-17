"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function OverviewTab() {
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    killedProjects: 0,
    totalProducts: 0,
    totalCatalogs: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { count: totalProjects } = await supabase
        .from("projects")
        .select("*", { count: "exact", head: true });
      const { count: activeProjects } = await supabase
        .from("projects")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");
      const { count: killedProjects } = await supabase
        .from("projects")
        .select("*", { count: "exact", head: true })
        .eq("status", "killed");
      const { count: totalProducts } = await supabase
        .from("showroom")
        .select("*", { count: "exact", head: true });
      const { count: totalCatalogs } = await supabase
        .from("catalogs")
        .select("*", { count: "exact", head: true });
      setStats({
        totalProjects: totalProjects || 0,
        activeProjects: activeProjects || 0,
        killedProjects: killedProjects || 0,
        totalProducts: totalProducts || 0,
        totalCatalogs: totalCatalogs || 0,
      });
      setLoading(false);
    }
    load();
  }, []);

  if (loading)
    return (
      <div className="text-center py-12 text-amber-600">Loading stats...</div>
    );

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Overview</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <StatCard label="Total Projects" value={stats.totalProjects} />
        <StatCard label="Active Projects" value={stats.activeProjects} color="blue" />
        <StatCard label="Completed Projects" value={stats.killedProjects} color="green" />
        <StatCard label="Showroom Products" value={stats.totalProducts} color="purple" />
        <StatCard label="Catalog Spaces" value={stats.totalCatalogs} color="amber" />
      </div>
    </div>
  );
}

function StatCard({ label, value, color = "gray" }) {
  const colorMap = {
    gray: "from-gray-600 to-gray-800",
    blue: "from-blue-500 to-blue-700",
    green: "from-green-500 to-green-700",
    purple: "from-purple-500 to-purple-700",
    amber: "from-amber-500 to-amber-700",
  };
  return (
    <div
      className={`bg-gradient-to-br ${colorMap[color]} text-white rounded-xl p-6 shadow-md`}
    >
      <p className="text-sm opacity-80">{label}</p>
      <p className="text-4xl font-bold mt-2">{value}</p>
    </div>
  );
}
