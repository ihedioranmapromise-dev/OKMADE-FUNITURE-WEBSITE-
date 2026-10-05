const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://okmade.vercel.app";

export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/api/",
          "/cancel-delete",
          "/client/dashboard",
          "/client/messages",
          "/client/notifications",
          "/client/settings",
          "/client/profile",
          "/client/onboarding",
          "/client/verify-email",
          "/client/login",
          "/client/signup",
          "/client/forgot-password",
          "/client/reset-password",
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
