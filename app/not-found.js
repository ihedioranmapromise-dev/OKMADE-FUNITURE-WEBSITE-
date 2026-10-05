import Link from "next/link";

export const metadata = {
  title: "Page Not Found — OKMADE",
};

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-50 to-white dark:from-gray-950 dark:to-gray-900 px-4 pt-16">
      <div className="max-w-lg w-full text-center">
        <div className="relative inline-block mb-6">
          <p className="text-[120px] md:text-[160px] font-bold text-amber-200 dark:text-amber-900/40 font-['Dancing_Script',_cursive] leading-none select-none">
            404
          </p>
          <img
            src="/favicon.ico"
            alt="OKMADE"
            className="absolute inset-0 m-auto w-16 h-16 md:w-20 md:h-20 object-contain drop-shadow-lg animate-[pulseZoom_2s_ease-in-out_infinite]"
          />
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-3">
          This page doesn't exist
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
          The link might be broken, or the page may have been moved. Let's get
          you back to something useful.
        </p>

        <div className="flex gap-3 justify-center flex-wrap">
          <Link
            href="/"
            className="bg-amber-600 hover:bg-amber-700 text-white font-semibold px-6 py-3 rounded-full transition shadow-lg hover:shadow-xl"
          >
            Go Home
          </Link>
          <Link
            href="/portfolio"
            className="bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold px-6 py-3 rounded-full border border-gray-200 dark:border-gray-700 transition"
          >
            View Portfolio
          </Link>
        </div>

        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-md mx-auto">
          {[
            { href: "/showroom", label: "Showroom" },
            { href: "/catalog", label: "Catalog" },
            { href: "/workers", label: "Artisans" },
            { href: "/feed", label: "Feed" },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm text-amber-600 dark:text-amber-400 hover:underline"
            >
              {l.label}
            </Link>
          ))}
        </div>

        <style>{`
          @keyframes pulseZoom {
            0%, 100% { transform: scale(1) rotate(0deg); }
            50% { transform: scale(1.15) rotate(-4deg); }
          }
        `}</style>
      </div>
    </div>
  );
}
