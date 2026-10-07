"use client";
import { useEffect, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase-browser";

const supabase = createSupabaseBrowser();

const DISMISS_KEY = "okmade_promo_dismissed";

export default function PromoBanner() {
  const [banner, setBanner] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const { data } = await supabase
          .from("promo_banners")
          .select("*")
          .eq("active", true)
          .order("created_at", { ascending: false })
          .limit(1);

        const b = data?.[0];
        if (!b) return;
        if (b.expires_at && new Date(b.expires_at) < new Date()) return;

        const dismissedId =
          typeof window !== "undefined"
            ? localStorage.getItem(DISMISS_KEY)
            : null;
        if (dismissedId === b.id) return;

        if (!cancelled) setBanner(b);
      } catch {}
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!banner) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, banner.id);
    } catch {}
    setBanner(null);
  };

  return (
    <div className="relative bg-gradient-to-r from-amber-600 via-amber-500 to-orange-600 text-white text-center py-2.5 px-10">
      <div className="flex items-center justify-center gap-3 flex-wrap">
        <span className="text-sm font-medium">{banner.message}</span>
        {banner.cta_text && banner.cta_url && (
          <a
            href={banner.cta_url}
            className="bg-white/25 hover:bg-white/35 text-white text-xs font-semibold px-3 py-1 rounded-full transition"
          >
            {banner.cta_text}
          </a>
        )}
      </div>
      <button
        onClick={dismiss}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-1.5"
        aria-label="Dismiss"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
