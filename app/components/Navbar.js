"use client";
import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import { useTheme } from "@/lib/theme";

const MenuIcon = ({ isOpen }) => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    {isOpen ? (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
    ) : (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
    )}
  </svg>
);

const FeedIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h10" />
  </svg>
);
const DashboardIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zm0 6a1 1 0 011-1h4a1 1 0 011 1v8a1 1 0 01-1 1h-4a1 1 0 01-1-1v-8zM4 14a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1v-5z" />
  </svg>
);
const LogoutIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);
const SunIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);
const MoonIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
  </svg>
);

export default function Navbar() {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const avatarMenuRef = useRef(null);
  const isHome = pathname === "/";

  useEffect(() => {
    const supabase = createSupabaseBrowser();
    let mounted = true;

    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (mounted) setProfile(null);
        return;
      }
      const { data } = await supabase
        .from("clients")
        .select("username, profile_pic, display_name, is_okmade, verified")
        .eq("auth_id", user.id)
        .maybeSingle();
      if (mounted) setProfile(data || null);
    }

    loadProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadProfile();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    function handleClick(e) {
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(e.target)) {
        setAvatarMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const confirmLogout = async () => {
    const supabase = createSupabaseBrowser();
    await supabase.auth.signOut();
    setProfile(null);
    setIsMenuOpen(false);
    setAvatarMenuOpen(false);
    setShowLogoutConfirm(false);
    window.location.href = "/";
  };

  const navLinks = isHome
    ? [
        { href: "#home", label: "Home" },
        { href: "#about", label: "About" },
        { href: "#contact", label: "Contact" },
        { href: "#reviews", label: "Reviews" },
        { href: "/portfolio", label: "Portfolio" },
        { href: "/workers", label: "Artisans" },
      ]
    : [
        { href: "/", label: "Home" },
        { href: "/portfolio", label: "Portfolio" },
        { href: "/workers", label: "Artisans" },
      ];

  return (
    <>
      <nav className="fixed top-0 left-0 w-full z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-sm border-b border-amber-100/20 dark:border-gray-800">
        <div className="container mx-auto px-4 md:px-6 flex items-center justify-between h-16">
          <a href="/" className="flex items-center gap-2 text-2xl font-bold text-amber-800 dark:text-amber-400 font-['Dancing_Script',_cursive]">
            <img src="/favicon.ico" alt="OKMADE" className="w-8 h-8 object-contain" />
            <span>OKMADE</span>
          </a>

          <div className="hidden md:flex gap-8 text-gray-700 dark:text-gray-300 font-medium items-center">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className="hover:text-amber-700 dark:hover:text-amber-400 transition">
                {link.label}
              </a>
            ))}

            {profile ? (
              <div className="relative" ref={avatarMenuRef}>
                <button
                  onClick={() => setAvatarMenuOpen(!avatarMenuOpen)}
                  className="flex items-center gap-2 hover:opacity-90 transition"
                  aria-label="Account menu"
                >
                  {profile.profile_pic ? (
                    <img
                      src={profile.profile_pic}
                      alt={profile.display_name || profile.username}
                      className="w-9 h-9 rounded-full object-cover ring-2 ring-amber-200 dark:ring-amber-700"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-amber-600 text-white flex items-center justify-center font-semibold text-sm">
                      {(profile.display_name || profile.username || "?").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <svg className="w-3 h-3 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {avatarMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden z-50">
                    <a
                      href="/feed"
                      onClick={() => setAvatarMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-amber-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm"
                    >
                      <FeedIcon /> Public Feed
                    </a>
                    <a
                      href="/client/dashboard"
                      onClick={() => setAvatarMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-amber-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm"
                    >
                      <DashboardIcon /> Dashboard
                    </a>
                    <button
                      onClick={toggle}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-amber-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm text-left"
                    >
                      {theme === "dark" ? <SunIcon /> : <MoonIcon />}
                      {theme === "dark" ? "Light mode" : "Dark mode"}
                    </button>
                    <div className="border-t border-gray-100 dark:border-gray-800" />
                    <button
                      onClick={() => {
                        setAvatarMenuOpen(false);
                        setShowLogoutConfirm(true);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 text-sm text-left"
                    >
                      <LogoutIcon /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <a href="/client/login" className="hover:text-amber-700 dark:hover:text-amber-400 transition">
                Login
              </a>
            )}
          </div>

          <button
            className="md:hidden text-2xl text-gray-700 dark:text-gray-300"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Menu"
          >
            <MenuIcon isOpen={isMenuOpen} />
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-amber-100/20 dark:border-gray-800 py-4 px-6 flex flex-col gap-4 text-gray-700 dark:text-gray-300 font-medium">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className="hover:text-amber-700 dark:hover:text-amber-400"
              >
                {link.label}
              </a>
            ))}

            {profile ? (
              <>
                <div className="border-t border-gray-100 dark:border-gray-800 pt-4 mt-1" />
                <a
                  href="/feed"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 hover:text-amber-700 dark:hover:text-amber-400"
                >
                  <FeedIcon /> Public Feed
                </a>
                <a
                  href="/client/dashboard"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 hover:text-amber-700 dark:hover:text-amber-400"
                >
                  <DashboardIcon /> Dashboard
                </a>
                <button
                  onClick={toggle}
                  className="flex items-center gap-3 hover:text-amber-700 dark:hover:text-amber-400 text-left"
                >
                  {theme === "dark" ? <SunIcon /> : <MoonIcon />}
                  {theme === "dark" ? "Light mode" : "Dark mode"}
                </button>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    setShowLogoutConfirm(true);
                  }}
                  className="text-left text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 flex items-center gap-3"
                >
                  <LogoutIcon /> Logout
                </button>
              </>
            ) : (
              <a
                href="/client/login"
                onClick={() => setIsMenuOpen(false)}
                className="hover:text-amber-700 dark:hover:text-amber-400"
              >
                Login
              </a>
            )}
          </div>
        )}
      </nav>

      {showLogoutConfirm && (
        <div
          className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4"
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">
              Log out?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-5">
              Are you sure you want to log out of your account?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium py-2.5 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 rounded-lg transition"
              >
                Yes, Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
