"use client";

const Icon = ({ children, className = "w-5 h-5" }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    strokeWidth="1.8"
  >
    {children}
  </svg>
);

const Icons = {
  overview: () => (
    <Icon>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </Icon>
  ),
  inbox: () => (
    <Icon>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </Icon>
  ),
  analytics: () => (
    <Icon>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </Icon>
  ),
  projects: () => (
    <Icon>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </Icon>
  ),
  progress: () => (
    <Icon>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </Icon>
  ),
  portfolio: () => (
    <Icon>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </Icon>
  ),
  products: () => (
    <Icon>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </Icon>
  ),
  catalogs: () => (
    <Icon>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </Icon>
  ),
  categories: () => (
    <Icon>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
    </Icon>
  ),
  users: () => (
    <Icon>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </Icon>
  ),
  reviews: () => (
    <Icon>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.969 0 1.371 1.24.588 1.81l-3.97 2.883a1 1 0 00-.364 1.118l1.518 4.674c.3.922-.755 1.688-1.54 1.118l-3.97-2.883a1 1 0 00-1.175 0l-3.97 2.883c-.784.57-1.838-.196-1.54-1.118l1.519-4.674a1 1 0 00-.364-1.118L2.98 10.1c-.783-.57-.38-1.81.588-1.81h4.907a1 1 0 00.95-.69l1.519-4.674z" />
    </Icon>
  ),
  comments: () => (
    <Icon>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </Icon>
  ),
  posts: () => (
    <Icon>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
    </Icon>
  ),
  "delete-requests": () => (
    <Icon>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
    </Icon>
  ),
  broadcast: () => (
    <Icon>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
    </Icon>
  ),
  content: () => (
    <Icon>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </Icon>
  ),
  branding: () => (
    <Icon>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </Icon>
  ),
  seo: () => (
    <Icon>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </Icon>
  ),
  "promo-banners": () => (
    <Icon>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
    </Icon>
  ),
  "social-links": () => (
    <Icon>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </Icon>
  ),
  "test-email": () => (
    <Icon>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </Icon>
  ),
  export: () => (
    <Icon>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </Icon>
  ),
  backup: () => (
    <Icon>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
    </Icon>
  ),
  activity: () => (
    <Icon>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </Icon>
  ),
  settings: () => (
    <Icon>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </Icon>
  ),
};

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
      { id: "export", label: "Export" },
      { id: "backup", label: "Backup" },
      { id: "activity", label: "Activity Log" },
      { id: "settings", label: "Settings" },
    ],
  },
];

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
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
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
              const TabIcon = Icons[item.id];
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
                  {TabIcon ? <TabIcon /> : null}
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
