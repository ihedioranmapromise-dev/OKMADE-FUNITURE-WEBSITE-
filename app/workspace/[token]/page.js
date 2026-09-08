"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useParams } from "next/navigation";
import { getOptimizedImage } from "@/lib/utils";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function WorkspacePage() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [requestImages, setRequestImages] = useState([]);
  const [progressImages, setProgressImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) return;
    async function fetchWorkspace() {
      // 1. Get token details
      const { data: tokenData, error: tokenError } = await supabase
        .from("tokens")
        .select("*")
        .eq("token_string", token)
        .single();
      if (tokenError || !tokenData) {
        setError("Invalid or expired token.");
        setLoading(false);
        return;
      }
      setData(tokenData);

      // 2. Get request images (original client request)
      const { data: reqImages } = await supabase
        .from("token_request_images")
        .select("image_url, description, display_order")
        .eq("token_id", tokenData.id)
        .order("display_order", { ascending: true });
      setRequestImages(reqImages || []);

      // 3. Get progress images
      const { data: progImages } = await supabase
        .from("progress_images")
        .select("image_url, uploaded_at, description, explanation")
        .eq("token_id", tokenData.id)
        .order("uploaded_at", { ascending: true });
      setProgressImages(progImages || []);

      setLoading(false);
    }
    fetchWorkspace();
  }, [token]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-900/90 via-amber-800/80 to-stone-800">
      <div className="text-amber-200 text-xl animate-pulse">Loading workspace...</div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-900/90 via-amber-800/80 to-stone-800">
      <div className="bg-white/10 backdrop-blur-sm text-white p-8 rounded-xl border border-white/10 text-center">
        <p className="text-red-400 text-xl">{error}</p>
      </div>
    </div>
  );

  const isActive = data.status === "active";

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-amber-900/90 via-amber-800/80 to-stone-800 py-12">
      {/* Decorative pattern overlay */}
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} />
      
      {/* Glow orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-amber-400/20 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-orange-300/15 blur-3xl pointer-events-none"></div>

      <div className="relative z-10 container mx-auto px-6 py-12 max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-bold text-center text-white mb-6 font-['Dancing_Script',_cursive] drop-shadow-lg">
          {isActive ? "Your Private Workspace" : "Completed Work – Testimonial"}
        </h1>
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-6 md:p-8 space-y-6 border border-white/20">
          
          {/* --- Request Images --- */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Original Request</h2>
            {requestImages.length === 0 ? (
              <p className="text-gray-500">No request images uploaded.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {requestImages.map((img, idx) => (
                  <div key={idx} className="bg-white rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                    <img
                      src={getOptimizedImage(img.image_url, 500)}
                      className="w-full h-48 object-cover"
                      alt={`Request ${idx + 1}`}
                    />
                    {img.description && (
                      <div className="p-2 text-sm text-gray-600 border-t border-gray-100">
                        {img.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* --- Progress Images --- */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              {isActive ? "Work in Progress" : "Final Result & Progress"}
            </h2>
            {progressImages.length === 0 ? (
              <p className="text-gray-500">No progress images yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {progressImages.map((img, idx) => (
                  <div key={idx} className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
                    <img
                      src={getOptimizedImage(img.image_url, 600)}
                      className="w-full h-64 object-cover"
                      alt="Progress"
                    />
                    {img.description && (
                      <div className="p-3 bg-gray-50 border-t border-gray-100">
                        <p className="text-sm font-medium text-gray-700">{img.description}</p>
                        {img.explanation && (
                          <p className="text-xs text-gray-500 mt-1">{img.explanation}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(img.uploaded_at).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {data.client_name && (
            <p className="text-gray-700 font-medium">Client: {data.client_name}</p>
          )}

          {isActive ? (
            <p className="text-blue-600 bg-blue-50 p-3 rounded-lg text-sm border border-blue-100">
              Your custom piece is being crafted. Check back later for updates.
            </p>
          ) : (
            <p className="text-green-600 bg-green-50 p-3 rounded-lg text-sm border border-green-100">
              Work completed! Thank you for choosing OKMADE Furniture.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}