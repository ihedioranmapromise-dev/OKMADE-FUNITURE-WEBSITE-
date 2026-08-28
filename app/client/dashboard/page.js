"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function ClientDashboard() {
  const [client, setClient] = useState(null);
  const [activeTokens, setActiveTokens] = useState([]);
  const [killedTokens, setKilledTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const clientId = sessionStorage.getItem("clientId");
    if (!clientId) {
      router.push("/client/login");
      return;
    }
    fetchClientData(clientId);
  }, []);

  async function fetchClientData(clientId) {
    setLoading(true);
    // Get client info
    const { data: clientData, error: clientError } = await supabase
      .from("clients")
      .select("*")
      .eq("id", clientId)
      .single();
    if (clientError || !clientData) {
      router.push("/client/login");
      return;
    }
    setClient(clientData);
    // Get tokens
    const { data: tokens } = await supabase
      .from("tokens")
      .select("id, token_string, status, created_at, work_description")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });
    setActiveTokens(tokens?.filter(t => t.status === "active") || []);
    setKilledTokens(tokens?.filter(t => t.status === "killed") || []);
    setLoading(false);
  }

  const logout = () => {
    sessionStorage.removeItem("clientId");
    sessionStorage.removeItem("clientUsername");
    router.push("/");
  };

  if (loading) return <div className="p-8 text-center">Loading your dashboard...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-amber-800 font-['Dancing_Script',_cursive]">
            Welcome, {client?.display_name || client?.username}
          </h1>
          <div className="flex gap-4">
            <a href="/client/profile" className="text-amber-600 hover:underline">Edit Profile</a>
            <button onClick={logout} className="text-red-600 hover:underline">Logout</button>
          </div>
        </div>

        {/* Active Projects */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Active Projects</h2>
          {activeTokens.length === 0 ? (
            <p className="text-gray-500">No active projects right now.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeTokens.map((token) => (
                <div key={token.id} className="bg-white rounded-xl shadow-md p-6 border border-amber-100">
                  <p className="text-sm text-gray-500">Token: <span className="font-mono">{token.token_string}</span></p>
                  <p className="text-gray-700 mt-2">{token.work_description || "Project in progress"}</p>
                  <div className="flex gap-3 mt-4 flex-wrap">
                    <a href={`/workspace/${token.token_string}`} className="text-amber-600 hover:underline text-sm">View Workspace</a>
                    <a href={`/client/upload/${token.id}`} className="bg-amber-600 text-white px-4 py-1 rounded-full text-sm hover:bg-amber-700 transition">Share Update</a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Completed Projects (Killed) */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Completed Projects</h2>
          {killedTokens.length === 0 ? (
            <p className="text-gray-500">No completed projects yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {killedTokens.map((token) => (
                <div key={token.id} className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                  <p className="text-sm text-gray-500">Token: <span className="font-mono">{token.token_string}</span> <span className="ml-2 text-green-600">✅ Completed</span></p>
                  <p className="text-gray-700 mt-2">{token.work_description || "Completed project"}</p>
                  <a href={`/workspace/${token.token_string}`} className="text-amber-600 hover:underline text-sm">View Public Page</a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
