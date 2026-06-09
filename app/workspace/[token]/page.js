"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useParams } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function WorkspacePage() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [progressImages, setProgressImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) return;
    async function fetchWorkspace() {
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
      const { data: images } = await supabase
        .from("progress_images")
        .select("image_url, uploaded_at")
        .eq("token_id", tokenData.id)
        .order("uploaded_at", { ascending: true });
      setData(tokenData);
      setProgressImages(images || []);
      setLoading(false);
    }
    fetchWorkspace();
  }, [token]);

  if (loading) return <div className="text-center p-8">Loading workspace...</div>;
  if (error) return <div className="text-center p-8 text-red-600">{error}</div>;

  const isActive = data.status === "active";

  return (
    <div className="container mx-auto px-6 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">
        {isActive ? "Your Private Workspace" : "Completed Work – Testimonial"}
      </h1>
      <div className="bg-white rounded-xl shadow-md p-6 space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">Original Request</h2>
          {data.request_image_url ? (
            <img src={data.request_image_url} className="w-full max-h-96 object-contain rounded-lg border" />
          ) : (
            <p className="text-gray-500">No request image uploaded.</p>
          )}
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">
            {isActive ? "Work in Progress" : "Final Result & Progress"}
          </h2>
          {progressImages.length === 0 ? (
            <p className="text-gray-500">No progress images yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {progressImages.map((img, idx) => (
                <img key={idx} src={img.image_url} className="w-full h-64 object-cover rounded-lg shadow" />
              ))}
            </div>
          )}
        </div>
        {data.client_name && <p className="text-gray-600">Client: {data.client_name}</p>}
        {isActive && (
          <p className="text-blue-600 bg-blue-50 p-3 rounded text-sm">
            Your custom piece is being crafted. Check back later for updates.
          </p>
        )}
        {!isActive && (
          <p className="text-green-600 bg-green-50 p-3 rounded text-sm">
            Work completed! Thank you for choosing OKMADE Furniture.
          </p>
        )}
      </div>
    </div>
  );
                                    }
