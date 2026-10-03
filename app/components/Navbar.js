"use client";
import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase-browser";

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

export default function Navbar() {
  const pathname = usePathname();
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
        .select("username, profile_pic, display_name")
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
      <nav className="fixed top-0 left-0 w-full z-50 bg-white/90 backdrop-blur-md shadow-sm border-b border-amber-100/20">
        <div className="container mx-auto px-4 md:px-6 flex items-center justify-between h-16">
          <a href="/" className="flex items-center gap-2 text-2xl font-bold text-amber-800 font-['Dancing_Script',_cursive]">
            <img src="/favicon.ico" alt="OKMADE" className="w-8 h-8 object-contain" />
            <span>OKMADE</span>
          </a>

          <div className="hidden md:flex gap-8 text-gray-700 font-medium items-center">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className="hover:text-amber-700 transition">
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
                      className="w-9 h-9 rounded-full object-cover ring-2 ring-amber-200"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-amber-600 text-white flex items-center justify-center font-semibold text-sm">
                      {(profile.display_name || profile.username || "?").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {avatarMenuOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
                    <a
                      href="/feed"
                      onClick={() => setAvatarMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-amber-50 text-gray-700 text-sm"
                    >
                      <FeedIcon /> Public Feed
                    </a>
                    <a
                      href="/client/dashboard"
                      onClick={() => setAvatarMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-amber-50 text-gray-700 text-sm"
                    >
                      <DashboardIcon /> Dashboard
                    </a>
                    <div className="border-t" />
                    <button
                      onClick={() => {
                        setAvatarMenuOpen(false);
                        setShowLogoutConfirm(true);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 text-red-600 text-sm text-left"
                    >
                      <LogoutIcon /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <a href="/client/login" className="hover:text-amber-700 transition">Login</a>
            )}
          </div>

          <button className="md:hidden text-2xl" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Menu">
            <MenuIcon isOpen={isMenuOpen} />
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-md border-t border-amber-100/20 py-4 px-6 flex flex-col gap-4 text-gray-700 font-medium">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className="hover:text-amber-700"
              >
                {link.label}
              </a>
            ))}

            {profile ? (
              <>
                <div className="border-t pt-4 mt-1" />
                <a
                  href="/feed"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 hover:text-amber-700"
                >
                  <FeedIcon /> Public Feed
                </a>
                <a
                  href="/client/dashboard"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 hover:text-amber-700"
                >
                  <DashboardIcon /> Dashboard
                </a>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    setShowLogoutConfirm(true);
                  }}
                  className="text-left text-red-600 hover:text-red-800 flex items-center gap-3"
                >
                  <LogoutIcon /> Logout
                </button>
              </>
            ) : (
              <a href="/client/login" onClick={() => setIsMenuOpen(false)} className="hover:text-amber-700">
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
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-800 mb-2">Log out?</h3>
            <p className="text-gray-600 text-sm mb-5">
              Are you sure you want to log out of your account?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2.5 rounded-lg transition"
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
