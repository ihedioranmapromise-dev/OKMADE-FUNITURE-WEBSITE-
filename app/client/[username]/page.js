"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useParams } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function ClientPortfolio() {
  const { username } = useParams();
  const [client, setClient] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const { data: clientData, error } = await supabase
        .from("clients")
        .select("*")
        .eq("username", username)
        .single();
      if (error || !clientData) {
        setLoading(false);
        return;
      }
      setClient(clientData);
      const { data: tokens } = await supabase
        .from("tokens")
        .select("id, token_string, work_description, created_at")
        .eq("client_id", clientData.id)
        .eq("status", "killed")
        .order("created_at", { ascending: false });
      setProjects(tokens || []);
      setLoading(false);
    }
    fetchData();
  }, [username]);

  if (loading) return <div className="p-8 text-center">Loading portfolio...</div>;
  if (!client) return <div className="p-8 text-center text-red-600">Client not found.</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-amber-800 font-['Dancing_Script',_cursive]">{client.display_name || client.username}'s Portfolio</h1>
          {client.bio && <p className="text-gray-600 mt-2 max-w-2xl mx-auto">{client.bio}</p>}
        </div>
        {projects.length === 0 ? (
          <p className="text-center text-gray-500">No completed projects yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project) => (
              <a key={project.id} href={`/workspace/${project.token_string}`} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition block">
                <div className="p-4">
                  <p className="font-semibold text-gray-800">{project.work_description || "Completed Project"}</p>
                  <p className="text-sm text-gray-500">Completed: {new Date(project.created_at).toLocaleDateString()}</p>
                  <p className="text-amber-600 text-sm mt-2">View Project →</p>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
