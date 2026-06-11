"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function ManageTestimonials() {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  if (typeof window !== "undefined" && sessionStorage.getItem("adminAuth") !== "true") {
    router.push("/admin/login");
    return null;
  }

  useEffect(() => {
    fetchTestimonials();
  }, []);

  async function fetchTestimonials() {
    const { data, error } = await supabase
      .from("tokens")
      .select("id, token_string, client_name, work_description, created_at")
      .eq("status", "killed")
      .order("created_at", { ascending: false });
    if (!error) setTestimonials(data || []);
    setLoading(false);
  }

  async function deleteTestimonial(id, tokenString) {
    if (!confirm(`Delete testimonial for ${tokenString}? This action cannot be undone.`)) return;
    // First, get all request images and progress images to delete from storage
    const { data: reqImages } = await supabase
      .from("token_request_images")
      .select("image_url")
      .eq("token_id", id);
    const { data: progImages } = await supabase
      .from("progress_images")
      .select("image_url")
      .eq("token_id", id);
    const allImages = [...(reqImages || []), ...(progImages || [])];
    for (const img of allImages) {
      const path = img.image_url.split('/public/')[1];
      if (path) {
        // Determine bucket: workspace-requests or workspace-progress
        const bucket = path.startsWith('requests/') ? 'workspace-requests' : 'workspace-progress';
        await supabase.storage.from(bucket).remove([path]);
      }
    }
    // Delete child rows (cascade should handle, but manual safe)
    await supabase.from("token_request_images").delete().eq("token_id", id);
    await supabase.from("progress_images").delete().eq("token_id", id);
    // Delete the token itself
    const { error } = await supabase.from("tokens").delete().eq("id", id);
    if (error) alert("Error deleting testimonial: " + error.message);
    else fetchTestimonials();
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Manage Testimonials (Killed Tokens)</h1>
      {loading ? (
        <p>Loading...</p>
      ) : testimonials.length === 0 ? (
        <p>No testimonials yet.</p>
      ) : (
        <table className="min-w-full bg-white border">
          <thead>
            <tr><th className="py-2 px-4 border">Token</th><th className="py-2 px-4 border">Client Name</th><th className="py-2 px-4 border">Description</th><th className="py-2 px-4 border">Created</th><th className="py-2 px-4 border">Actions</th></tr>
          </thead>
          <tbody>
            {testimonials.map((t) => (
              <tr key={t.id}>
                <td className="py-2 px-4 border">{t.token_string}</td>
                <td className="py-2 px-4 border">{t.client_name}</td>
                <td className="py-2 px-4 border">{t.work_description?.slice(0,50)}</td>
                <td className="py-2 px-4 border">{new Date(t.created_at).toLocaleDateString()}</td>
                <td className="py-2 px-4 border">
                  <button onClick={() => router.push(`/workspace/${t.token_string}`)} className="bg-blue-500 text-white px-3 py-1 rounded mr-2">View</button>
                  <button onClick={() => deleteTestimonial(t.id, t.token_string)} className="bg-red-500 text-white px-3 py-1 rounded">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
    }
