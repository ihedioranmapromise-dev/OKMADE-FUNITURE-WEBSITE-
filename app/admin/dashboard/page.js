"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ThemeProvider } from "@/lib/theme";
import AuthGuard from "./components/AuthGuard";
import Sidebar, { TAB_GROUPS } from "./components/Sidebar";
import TopBar from "./components/TopBar";
import CommandPalette from "./components/CommandPalette";

import OverviewTab from "./components/OverviewTab";
import InboxTab from "./components/InboxTab";
import AnalyticsTab from "./components/AnalyticsTab";
import GenerateProjectTab from "./components/GenerateProjectTab";
import UploadProgressTab from "./components/UploadProgressTab";
import ManagePortfolioTab from "./components/ManagePortfolioTab";
import ManageProductsTab from "./components/ManageProductsTab";
import ManageCatalogsTab from "./components/ManageCatalogsTab";
import AddShowroomTab from "./components/AddShowroomTab";
import AddCatalogTab from "./components/AddCatalogTab";
import CategoriesTab from "./components/CategoriesTab";
import UsersTab from "./components/UsersTab";
import ReviewsTab from "./components/ReviewsTab";
import CommentsTab from "./components/CommentsTab";
import PostsTab from "./components/PostsTab";
import DeleteRequestsTab from "./components/DeleteRequestsTab";
import BroadcastTab from "./components/BroadcastTab";
import ContentTab from "./components/ContentTab";
import BrandingTab from "./components/BrandingTab";
import SeoTab from "./components/SeoTab";
import PromoBannerTab from "./components/PromoBannerTab";
import SocialLinksTab from "./components/SocialLinksTab";
import TestEmailTab from "./components/TestEmailTab";
import ExportTab from "./components/ExportTab";
import BackupTab from "./components/BackupTab";
import ActivityTab from "./components/ActivityTab";
import SettingsTab from "./components/SettingsTab";

const VALID_TABS = new Set(
  TAB_GROUPS.flatMap((g) => g.items.map((i) => i.id))
);

const DEFAULT_TAB = "overview";

function DashboardInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(DEFAULT_TAB);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

  useEffect(() => {
    const t = searchParams.get("tab");
    if (t && VALID_TABS.has(t)) {
      setActiveTab(t);
    } else {
      setActiveTab(DEFAULT_TAB);
    }
  }, [searchParams]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("admin_sidebar_collapsed");
    if (stored === "true") setSidebarCollapsed(true);
  }, []);

  const selectTab = (id) => {
    setActiveTab(id);
    router.replace(`/admin/dashboard?tab=${id}`, { scroll: false });
  };

  const toggleCollapse = () => {
    const next = !sidebarCollapsed;
    setSidebarCollapsed(next);
    localStorage.setItem("admin_sidebar_collapsed", next ? "true" : "false");
  };

  const renderTab = () => {
    switch (activeTab) {
      case "overview":
        return <OverviewTab />;
      case "inbox":
        return <InboxTab />;
      case "analytics":
        return <AnalyticsTab />;
      case "projects":
        return <GenerateProjectTab />;
      case "progress":
        return <UploadProgressTab />;
      case "portfolio":
        return <ManagePortfolioTab />;
      case "products":
        return <ManageProductsTab />;
      case "catalogs":
        return <ManageCatalogsTab />;
      case "showroom":
        return <AddShowroomTab />;
      case "add-catalog":
        return <AddCatalogTab />;
      case "categories":
        return <CategoriesTab />;
      case "users":
        return <UsersTab />;
      case "reviews":
        return <ReviewsTab />;
      case "comments":
        return <CommentsTab />;
      case "posts":
        return <PostsTab />;
      case "delete-requests":
        return <DeleteRequestsTab />;
      case "broadcast":
        return <BroadcastTab />;
      case "content":
        return <ContentTab />;
      case "branding":
        return <BrandingTab />;
      case "seo":
        return <SeoTab />;
      case "promo-banners":
        return <PromoBannerTab />;
      case "social-links":
        return <SocialLinksTab />;
      case "test-email":
        return <TestEmailTab />;
      case "export":
        return <ExportTab />;
      case "backup":
        return <BackupTab />;
      case "activity":
        return <ActivityTab />;
      case "settings":
        return <SettingsTab />;
      default:
        return <OverviewTab />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar
        activeTab={activeTab}
        onSelect={selectTab}
        collapsed={sidebarCollapsed}
        onToggleCollapse={toggleCollapse}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      <div
        className={`transition-all duration-200 ${
          sidebarCollapsed ? "md:pl-16" : "md:pl-60"
        }`}
      >
        <TopBar
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          onOpenCommand={() => setCommandOpen(true)}
        />

        <main className="p-4 md:p-6 max-w-7xl mx-auto">
          {renderTab()}
        </main>
      </div>

      <CommandPalette
        open={commandOpen}
        onClose={() => setCommandOpen(false)}
        onSelectTab={selectTab}
      />
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <ThemeProvider>
      <AuthGuard>
        <Suspense
          fallback={
            <div className="min-h-screen flex items-center justify-center">
              Loading...
            </div>
          }
        >
          <DashboardInner />
        </Suspense>
      </AuthGuard>
    </ThemeProvider>
  );
}
