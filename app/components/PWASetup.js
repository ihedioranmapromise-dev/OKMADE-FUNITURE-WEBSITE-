"use client";
import { useEffect } from "react";

export default function PWASetup() {
  useEffect(() => {
    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/service-worker.js")
        .then((reg) => console.log("SW registered"))
        .catch((err) => console.log("SW error:", err));
    }

    // Capture install prompt
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      window.deferredPrompt = e;
    });
  }, []);

  return null;
}
