"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function SplashScreen() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    setVisible(true);
    setFading(false);
    const minTime = 700;
    const start = Date.now();
    const timeout = setTimeout(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, minTime - elapsed);
      setTimeout(() => {
        setFading(true);
        setTimeout(() => setVisible(false), 400);
      }, remaining);
    }, 200);

    return () => clearTimeout(timeout);
  }, [pathname]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-amber-50 via-cream to-white transition-opacity duration-400 ${
        fading ? "opacity-0" : "opacity-100"
      }`}
      style={{ backgroundColor: "#FFFBEB" }}
    >
      <div className="relative animate-[pulseZoom_1.4s_ease-in-out_infinite]">
        <img
          src="/favicon.ico"
          alt="OKMADE"
          className="w-20 h-20 md:w-28 md:h-28 object-contain drop-shadow-lg"
        />
      </div>
      <p className="mt-6 text-lg md:text-xl font-['Dancing_Script',_cursive] text-amber-800 tracking-wide">
        OKMADE
      </p>
      <p className="mt-1 text-xs text-amber-600/70 tracking-widest uppercase">
        Trust the progress
      </p>

      <style jsx>{`
        @keyframes pulseZoom {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.15);
            opacity: 0.85;
          }
        }
      `}</style>
    </div>
  );
}
