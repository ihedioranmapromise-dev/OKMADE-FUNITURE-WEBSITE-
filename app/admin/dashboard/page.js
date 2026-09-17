"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

import OverviewTab from "./components/OverviewTab";
import GenerateProjectTab from "./components/GenerateProjectTab";
import UploadProgressTab from "./components/UploadProgressTab";
import ManagePortfolioTab from "./components/ManagePortfolioTab";
import ManageProductsTab from "./components/ManageProductsTab";
import ManageCatalogsTab from "./components/ManageCatalogsTab";
import AddShowroomTab from "./components/AddShowroomTab";
import AddCatalogTab from "./components/AddCatalogTab";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/* ---------- SVG Icons ---------- */
const IconOverview = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const IconPlus = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);

const IconUpload = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 4v12m0-12l-4 4m4-4l4 4" />
  </svg>
);

const IconFolder = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
  </svg>
);

const IconBag = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
  </svg>
);

const IconGrid = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

const IconCube = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" />
  </svg>
);

const IconImagePlus = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const IconBell = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const IconMenu = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const IconClose = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const TABS = [
  { id: "overview", label: "Overview", icon: IconOverview },
  { id: "projects", label: "Generate Project", icon: IconPlus },
  { id: "progress", label: "Upload Progress", icon: IconUpload },
  { id: "portfolio", label: "Manage Portfolio", icon: IconFolder },
  { id: "products", label: "Manage Products", icon: IconBag },
  { id: "catalogs", label: "Manage Catalogs", icon: IconGrid },
  { id: "showroom", label: "Add Showroom Product", icon: IconCube },
  { id: "add-catalog", label: "Add Catalog Space", icon: IconImagePlus },
];

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "overview";

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const auth = sessionStorage.getItem("adminAuth");
    if (auth !== "true") {
      router.push("/admin/login");
      return;
    }
    setAuthChecked(true);
    fetchNotifications();
  }, []);

  async function fetchNotifications() {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.is_read).length);
    }
  }

  const markAllRead = async () => {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .neq("is_read", true);
    setUnreadCount(0);
    fetchNotifications();
  };

  const handleNotificationClick = (n) => {
    supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", n.id)
      .then(() => fetchNotifications());
    if (n.target_url) router.push(n.target_url);
    setShowNotifications(false);
  };

  const switchTab = (tabId) => {
    router.push(`/admin/dashboard?tab=${tabId}`);
    setMobileMenuOpen(false);
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-amber-600">Checking access...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar – desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 fixed left-0 top-0 bottom-0 z-30">
        <div className="p-6 border-b border-gray-100">
          <a
            href="/"
            className="flex items-center gap-2 text-2xl font-bold text-amber-800 font-['Dancing_Script',_cursive]"
          >
            <img src="/favicon.ico" alt="OKMADE" className="w-8 h-8 object-contain" />
            <span>OKMADE</span>
          </a>
          <p className="text-xs text-gray-500 mt-1">Admin Control Room</p>
        </div>
        <nav className="flex-1 overflow-y-auto py-4">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => switchTab(tab.id)}
                className={`w-full flex items-center gap-3 px-6 py-3 text-sm font-medium transition text-left ${
                  active
                    ? "bg-amber-50 text-amber-800 border-r-4 border-amber-600"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? "text-amber-700" : "text-gray-500"}`} />
                {tab.label}
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-100 text-xs text-gray-400">
          © 2026 OKMADE
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 h-14">
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2">
            {mobileMenuOpen ? <IconClose /> : <IconMenu />}
          </button>
          <a
            href="/"
            className="text-lg font-bold text-amber-800 font-['Dancing_Script',_cursive]"
          >
            OKMADE
          </a>
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2"
            >
              <IconBell className="w-6 h-6 text-gray-700" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border z-50 max-h-96 overflow-y-auto">
                <div className="p-3 border-b flex justify-between items-center">
                  <span className="font-semibold text-sm">Notifications</span>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs text-blue-600">
                      Mark all read
                    </button>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    No notifications.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${
                        !n.is_read ? "bg-amber-50" : ""
                      }`}
                    >
                      <p className="text-sm">{n.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(n.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
        {mobileMenuOpen && (
          <nav className="border-t border-gray-100 bg-white">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => switchTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-6 py-3 text-sm font-medium text-left ${
                    active ? "bg-amber-50 text-amber-800" : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        )}
      </div>

      {/* Main */}
      <main className="flex-1 md:ml-64 pt-14 md:pt-0">
        <div className="hidden md:flex justify-end items-center px-8 py-4 bg-white border-b border-gray-100 sticky top-0 z-20">
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 hover:bg-gray-100 rounded-full"
            >
              <IconBell className="w-6 h-6 text-gray-700" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border z-50 max-h-96 overflow-y-auto">
                <div className="p-3 border-b flex justify-between items-center">
                  <span className="font-semibold">Notifications</span>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs text-blue-600">
                      Mark all read
                    </button>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    No notifications.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${
                        !n.is_read ? "bg-amber-50" : ""
                      }`}
                    >
                      <p className="text-sm">{n.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(n.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 md:p-8">
          {currentTab === "overview" && <OverviewTab />}
          {currentTab === "projects" && <GenerateProjectTab />}
          {currentTab === "progress" && <UploadProgressTab />}
          {currentTab === "portfolio" && <ManagePortfolioTab />}
          {currentTab === "products" && <ManageProductsTab />}
          {currentTab === "catalogs" && <ManageCatalogsTab />}
          {currentTab === "showroom" && <AddShowroomTab />}
          {currentTab === "add-catalog" && <AddCatalogTab />}
        </div>
      </main>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-pulse text-amber-600">Loading dashboard...</div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
