"use client";
import { useEffect, useState } from "react";

export default function InstallBanner() {
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSTutorial, setShowIOSTutorial] = useState(false);

  useEffect(() => {
    // Don't show if already dismissed within 30 days
    const dismissed = localStorage.getItem("okmade_install_dismissed");
    if (dismissed) {
      const daysSince = (Date.now() - parseInt(dismissed)) / (1000 * 60 * 60 * 24);
      if (daysSince < 30) return;
    }

    // Don't show if already installed (standalone mode)
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    // Detect iOS
    const ua = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(ua);
    setIsIOS(ios);

    // Show after 5 seconds
    const timer = setTimeout(() => setShow(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    localStorage.setItem("okmade_install_dismissed", Date.now().toString());
    setShow(false);
    setShowIOSTutorial(false);
  };

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSTutorial(true);
      return;
    }
    // Trigger browser install prompt
    if (window.deferredPrompt) {
      window.deferredPrompt.prompt();
      const { outcome } = await window.deferredPrompt.userChoice;
      if (outcome === "accepted") {
        dismiss();
      }
      window.deferredPrompt = null;
    }
  };

  if (!show) return null;

  return (
    <>
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:w-96 z-[100] bg-white rounded-2xl shadow-2xl border border-amber-200 p-4">
        <div className="flex items-start gap-3">
          <img src="/favicon.ico" alt="OKMADE" className="w-12 h-12 object-contain" />
          <div className="flex-1">
            <p className="font-semibold text-gray-900 text-sm">Install OKMADE app</p>
            <p className="text-xs text-gray-600 mt-1">
              Get the full experience — faster, offline, and on your home screen.
            </p>
            <div className="flex gap-2 mt-3">
              <button onClick={handleInstall} className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition">
                Install
              </button>
              <button onClick={dismiss} className="text-gray-500 hover:text-gray-700 text-xs px-3 py-1.5">
                Not now
              </button>
            </div>
          </div>
          <button onClick={dismiss} className="text-gray-400 hover:text-gray-600 text-lg leading-none">
            ✕
          </button>
        </div>
      </div>

      {showIOSTutorial && (
        <div className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-4" onClick={dismiss}>
          <div className="bg-white rounded-2xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Install on iPhone</h3>
            <p className="text-sm text-gray-600 mb-4">Follow these steps to install OKMADE:</p>
            <ol className="space-y-3 text-sm text-gray-700">
              <li className="flex gap-3">
                <span className="font-bold text-amber-600">1.</span>
                Tap the <strong>Share</strong> button in Safari (the square with an arrow pointing up).
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-amber-600">2.</span>
                Scroll down and tap <strong>"Add to Home Screen"</strong>.
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-amber-600">3.</span>
                Tap <strong>"Add"</strong> in the top right corner.
              </li>
            </ol>
            <button onClick={dismiss} className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2.5 rounded-lg mt-6 transition">
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
