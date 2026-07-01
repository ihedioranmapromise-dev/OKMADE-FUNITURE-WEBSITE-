"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { getOptimizedImage } from "@/lib/utils";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAllTestimonials() {
      const { data: killedTokens, error } = await supabase
        .from("tokens")
        .select("id, token_string, client_name, work_description, created_at")
        .eq("status", "killed")
        .order("created_at", { ascending: false });
      if (error || !killedTokens || killedTokens.length === 0) {
        setTestimonials([]);
        setLoading(false);
        return;
      }
      const testimonialsWithImages = await Promise.all(
        killedTokens.map(async (token) => {
          const { data: images } = await supabase
            .from("token_request_images")
            .select("image_url")
            .eq("token_id", token.id)
            .order("display_order", { ascending: true })
            .limit(1);
          return {
            ...token,
            image: images && images.length > 0 ? images[0].image_url : null,
          };
        })
      );
      setTestimonials(testimonialsWithImages);
      setLoading(false);
    }
    fetchAllTestimonials();
  }, []);

  return (
    <div className="container mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold text-center mb-10">All Testimonials</h1>
      {loading ? (
        <p className="text-center">Loading...</p>
      ) : testimonials.length === 0 ? (
        <p className="text-center">No testimonials yet. Completed works will appear here.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <a
              key={testimonial.id}
              href={`/workspace/${testimonial.token_string}`}
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition block"
            >
              <div className="h-48 overflow-hidden">
                {testimonial.image ? (
                  <img
                    src={getOptimizedImage(testimonial.image, 400)}
                    className="w-full h-full object-cover"
                    alt="Testimonial"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">No image</div>
                )}
              </div>
              <div className="p-5">
                <h3 className="font-bold text-xl mb-2">{testimonial.client_name || "Client"}</h3>
                <p className="text-gray-600 line-clamp-3">
                  {testimonial.work_description || "Completed furniture piece. See the full story."}
                </p>
                <p className="text-sm text-blue-500 mt-3">View full work →</p>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
