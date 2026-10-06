"use client";
import { AdminIconPaths } from "@/lib/admin-icons";

export const TAB_GROUPS = [
  {
    label: "Main",
    items: [
      { id: "overview", label: "Overview" },
      { id: "inbox", label: "Inbox" },
      { id: "analytics", label: "Analytics" },
    ],
  },
  {
    label: "Projects",
    items: [
      { id: "projects", label: "Generate Project" },
      { id: "progress", label: "Upload Progress" },
      { id: "portfolio", label: "Portfolio" },
    ],
  },
  {
    label: "Shop",
    items: [
      { id: "products", label: "Products" },
      { id: "catalogs", label: "Catalogs" },
      { id: "categories", label: "Categories" },
    ],
  },
  {
    label: "Community",
    items: [
      { id: "users", label: "Users" },
      { id: "reviews", label: "Reviews" },
      { id: "comments", label: "Comments" },
      { id: "posts", label: "Feed Posts" },
      { id: "delete-requests", label: "Delete Requests" },
      { id: "referrals", label: "Referrals" },
    ],
  },
  {
    label: "Content",
    items: [
      { id: "content", label: "Homepage" },
      { id: "branding", label: "Branding" },
      { id: "seo", label: "SEO" },
      { id: "promo-banners", label: "Promo Banners" },
      { id: "social-links", label: "Social Links" },
      { id: "redirects", label: "Redirects" },
    ],
  },
  {
    label: "Communication",
    items: [
      { id: "broadcast", label: "Broadcast" },
      { id: "test-email", label: "Test Email" },
    ],
  },
  {
    label: "System",
    items: [
      { id: "security", label: "Security" },
      { id: "error-log", label: "Error Log" },
      { id: "export", label: "Export" },
      { id: "import", label: "Import CSV" },
      { id: "backup", label: "Backup" },
      { id: "activity", label: "Activity Log" },
      { id: "settings", label: "Settings" },
    ],
  },
];

function IconSvg({ path, className = "w-5 h-5 flex-shrink-0" }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth="1.8"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
  );
}

function TabIcon({ id }) {
  const path = AdminIconPaths[id];
  if (!path) return null;
  return <IconSvg path={path} />;
}

export default function Sidebar({
  activeTab,
  onSelect,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onMobileClose,
}) {
  const isCollapsed = collapsed;

  const content = (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
      <div className="h-14 flex items-center justify-between px-3 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
        <a
          href="/admin/dashboard"
          onClick={onMobileClose}
          className="flex items-center gap-2 overflow-hidden"
        >
          <img
            src="/favicon.ico"
            alt="OKMADE"
            className="w-8 h-8 object-contain flex-shrink-0"
          />
          {!isCollapsed && (
            <span className="text-lg font-bold text-amber-800 dark:text-amber-300 font-['Dancing_Script',_cursive] whitespace-nowrap">
              OKMADE
            </span>
          )}
        </a>
        <button
          onClick={onToggleCollapse}
          className="hidden md:flex p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
          aria-label="Toggle sidebar"
          title={isCollapsed ? "Expand" : "Collapse"}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth="2"
          >
            {isCollapsed ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            )}
          </svg>
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-3">
        {TAB_GROUPS.map((group) => (
          <div key={group.label} className="mb-2">
            {!isCollapsed && (
              <p className="px-4 py-1.5 text-[10px] uppercase tracking-wider font-semibold text-gray-400 dark:text-gray-500">
                {group.label}
              </p>
            )}
            {isCollapsed && (
              <div className="mx-3 my-2 border-t border-gray-200 dark:border-gray-800" />
            )}
            {group.items.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelect(item.id);
                    onMobileClose();
                  }}
                  title={isCollapsed ? item.label : undefined}
                  className={`group relative w-full flex items-center gap-3 px-4 py-2.5 text-sm transition ${
                    isActive
                      ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 font-semibold"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  } ${isCollapsed ? "justify-center" : ""}`}
                >
                  {isActive && (
                    <span className="absolute left-0 top-0 bottom-0 w-1 bg-amber-600 dark:bg-amber-500" />
                  )}
                  <TabIcon id={item.id} />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                  {isCollapsed && (
                    <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition z-50">
                      {item.label}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>
    </div>
  );

  return (
    <>
      <aside
        className={`hidden md:block fixed top-0 left-0 bottom-0 z-30 transition-all duration-200 ${
          isCollapsed ? "w-16" : "w-60"
        }`}
      >
        {content}
      </aside>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-black/60" onClick={onMobileClose} />
          <div className="absolute top-0 left-0 bottom-0 w-64 max-w-[80vw] animate-[slideIn_0.2s_ease-out]">
            {content}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  );
}
