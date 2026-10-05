"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase-browser";

export default function VisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (pathname.startsWith("/admin") || pathname.startsWith("/api")) return;

    let cancelled = false;

    async function track() {
      try {
        const sb = createSupabaseBrowser();
        const {
          data: { user },
        } = await sb.auth.getUser();
        if (cancelled) return;

        await fetch("/api/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            path: pathname,
            referrer: document.referrer || null,
            is_logged_in: !!user,
          }),
        });
      } catch {}
    }

    // Delay slightly so it doesn't compete with page render
    const t = setTimeout(track, 800);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [pathname]);

  return null;
}
