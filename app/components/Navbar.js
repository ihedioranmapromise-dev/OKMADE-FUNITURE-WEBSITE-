"use client";
import { useEffect, useState } from "react";
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

export default function Navbar() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [profile, setProfile] = useState(null);
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

  const logout = async () => {
    const supabase = createSupabaseBrowser();
    await supabase.auth.signOut();
    setProfile(null);
    setIsMenuOpen(false);
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
            <div className="flex items-center gap-3">
              <a href={`/client/${profile.username}`} className="flex items-center gap-2 hover:opacity-90 transition" title={profile.display_name || profile.username}>
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
              </a>
              <button onClick={logout} className="text-sm text-red-600 hover:text-red-800 transition">
                Logout
              </button>
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
              <a
                href={`/client/${profile.username}`}
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-3 hover:text-amber-700"
              >
                {profile.profile_pic ? (
                  <img
                    src={profile.profile_pic}
                    alt=""
                    className="w-9 h-9 rounded-full object-cover ring-2 ring-amber-200"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-amber-600 text-white flex items-center justify-center font-semibold">
                    {(profile.display_name || profile.username || "?").charAt(0).toUpperCase()}
                  </div>
                )}
                <span>{profile.display_name || profile.username}</span>
              </a>
              <button onClick={logout} className="text-left text-red-600 hover:text-red-800">
                Logout
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
  );
}
