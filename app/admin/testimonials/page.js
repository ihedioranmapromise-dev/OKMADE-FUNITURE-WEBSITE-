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
      .from("projects")
      .select("id, token_string, client_name, work_description, city, created_at, is_standalone")
      .eq("status", "killed")
      .eq("is_standalone", false)
      .order("created_at", { ascending: false });
    if (!error) setTestimonials(data || []);
    setLoading(false);
  }

  async function deleteTestimonial(id, tokenString) {
    if (!confirm(`Delete testimonial for ${tokenString}? This action cannot be undone.`)) return;
    const { data: reqImages } = await supabase
      .from("project_request_images")
      .select("image_url")
      .eq("project_id", id);
    const { data: progImages } = await supabase
      .from("progress_images")
      .select("image_url")
      .eq("project_id", id);
    const allImages = [...(reqImages || []), ...(progImages || [])];
    for (const img of allImages) {
      const path = img.image_url.split("/public/")[1];
      if (path) {
        const bucket =
          path.startsWith("requests/") || path.startsWith("standalone")
            ? "workspace-requests"
            : "workspace-progress";
        await supabase.storage.from(bucket).remove([path]);
      }
    }
    await supabase.from("project_request_images").delete().eq("project_id", id);
    await supabase.from("progress_images").delete().eq("project_id", id);
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) alert("Error deleting testimonial: " + error.message);
    else fetchTestimonials();
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Manage Portfolio (Killed Projects)</h1>
      {loading ? (
        <p>Loading...</p>
      ) : testimonials.length === 0 ? (
        <p>No killed projects yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border">
            <thead>
              <tr className="bg-gray-50">
                <th className="py-2 px-4 border text-left">Token</th>
                <th className="py-2 px-4 border text-left">Client Name</th>
                <th className="py-2 px-4 border text-left">Description</th>
                <th className="py-2 px-4 border text-left">City</th>
                <th className="py-2 px-4 border text-left">Created</th>
                <th className="py-2 px-4 border text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {testimonials.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="py-2 px-4 border font-mono text-sm">{t.token_string}</td>
                  <td className="py-2 px-4 border">{t.client_name}</td>
                  <td className="py-2 px-4 border">{t.work_description?.slice(0, 40)}</td>
                  <td className="py-2 px-4 border">{t.city || "—"}</td>
                  <td className="py-2 px-4 border text-sm">
                    {new Date(t.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-2 px-4 border">
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => router.push(`/workspace/${t.token_string}`)}
                        className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600"
                      >
                        View
                      </button>
                      <button
                        onClick={() => router.push(`/admin/testimonials/edit/${t.id}`)}
                        className="bg-amber-500 text-white px-3 py-1 rounded text-xs hover:bg-amber-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteTestimonial(t.id, t.token_string)}
                        className="bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
