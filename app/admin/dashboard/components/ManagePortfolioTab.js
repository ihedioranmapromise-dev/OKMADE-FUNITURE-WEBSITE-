"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function ManagePortfolioTab() {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchTestimonials();
  }, []);

  async function fetchTestimonials() {
    const { data, error } = await supabase
      .from("projects")
      .select(
        "id, token_string, client_name, work_description, city, created_at, is_standalone"
      )
      .eq("status", "killed")
      .eq("is_standalone", false)
      .order("created_at", { ascending: false });
    if (!error) setTestimonials(data || []);
    setLoading(false);
  }

  async function deleteTestimonial(id, tokenString) {
    if (
      !confirm(
        `Delete testimonial for ${tokenString}? This action cannot be undone.`
      )
    )
      return;
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

  if (loading)
    return <div className="text-center py-12 text-amber-600">Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-gray-800">
        Manage Portfolio (Killed Projects)
      </h1>
      {testimonials.length === 0 ? (
        <p className="text-gray-500">No killed projects yet.</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200">
          <table className="min-w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase">
                  Token
                </th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase">
                  Client
                </th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase">
                  Description
                </th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase">
                  City
                </th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase">
                  Date
                </th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {testimonials.map((t) => (
                <tr key={t.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono text-sm">
                    {t.token_string}
                  </td>
                  <td className="py-3 px-4 text-sm">{t.client_name}</td>
                  <td className="py-3 px-4 text-sm">
                    {t.work_description?.slice(0, 40)}
                  </td>
                  <td className="py-3 px-4 text-sm">{t.city || "—"}</td>
                  <td className="py-3 px-4 text-xs text-gray-500">
                    {new Date(t.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() =>
                          router.push(`/workspace/${t.token_string}`)
                        }
                        className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600"
                      >
                        View
                      </button>
                      <button
                        onClick={() =>
                          router.push(`/admin/testimonials/edit/${t.id}`)
                        }
                        className="bg-amber-500 text-white px-3 py-1 rounded text-xs hover:bg-amber-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() =>
                          deleteTestimonial(t.id, t.token_string)
                        }
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
