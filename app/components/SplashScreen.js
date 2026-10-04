"use client";
import { useEffect, useState } from "react";

const SHOWN_KEY = "okmade_splash_shown";

export default function SplashScreen() {
  const [visible, setVisible] = useState(false);
  const [stage, setStage] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const shown = sessionStorage.getItem(SHOWN_KEY);
    if (shown === "true") return;

    setVisible(true);
    setStage(1);

    const t1 = setTimeout(() => setStage(2), 500);
    const t2 = setTimeout(() => setStage(3), 1400);
    const t3 = setTimeout(() => {
      setVisible(false);
      try {
        sessionStorage.setItem(SHOWN_KEY, "true");
      } catch {}
    }, 1900);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#FFFBEB] dark:bg-gray-950 transition-opacity duration-500 ${
        stage >= 3 ? "opacity-0" : "opacity-100"
      }`}
    >
      <div
        className={`relative transition-all duration-700 ease-out ${
          stage >= 1 ? "scale-100 opacity-100" : "scale-50 opacity-0"
        }`}
      >
        <div className="absolute inset-0 rounded-full bg-amber-400/20 blur-3xl scale-150 animate-pulse" />
        <img
          src="/favicon.ico"
          alt="OKMADE"
          className="relative w-24 h-24 md:w-32 md:h-32 object-contain drop-shadow-2xl animate-[pulseZoom_1.8s_ease-in-out_infinite]"
        />
      </div>

      <p
        className={`mt-6 text-3xl md:text-4xl font-['Dancing_Script',_cursive] text-amber-800 dark:text-amber-300 tracking-wide transition-all duration-700 ${
          stage >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        OKMADE
      </p>

      <p
        className={`mt-2 text-xs text-amber-600/70 dark:text-amber-400/70 tracking-[0.35em] uppercase transition-all duration-700 ${
          stage >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
        }`}
      >
        Trust the Progress
      </p>

      <div
        className={`absolute bottom-16 h-1 bg-amber-400/40 rounded-full overflow-hidden transition-opacity duration-500 ${
          stage >= 1 ? "opacity-100" : "opacity-0"
        }`}
        style={{ width: 120 }}
      >
        <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 animate-[loading_1.8s_ease-in-out_infinite]" />
      </div>

      <style jsx>{`
        @keyframes pulseZoom {
          0%, 100% {
            transform: scale(1) rotate(0deg);
          }
          50% {
            transform: scale(1.12) rotate(-3deg);
          }
        }
        @keyframes loading {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}
