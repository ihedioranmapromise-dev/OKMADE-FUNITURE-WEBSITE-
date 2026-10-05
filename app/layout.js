import "./globals.css";
import Script from "next/script";
import { cookies } from "next/headers";
import SplashScreen from "./components/SplashScreen";
import InstallBanner from "./components/InstallBanner";
import PWASetup from "./components/PWASetup";
import OfflineBanner from "./components/OfflineBanner";
import OfflineQueueIndicator from "./components/OfflineQueueIndicator";
import PromoBanner from "./components/PromoBanner";
import ThemeInit from "./components/ThemeInit";
import VisitTracker from "./components/VisitTracker";
import { ThemeProvider } from "@/lib/theme";
import { THEME_COOKIE, THEME_DEFAULT } from "@/lib/theme-constants";

export const metadata = {
  title: "OKMADE Furniture",
  description: "Custom furniture and showroom – handcrafted pieces for modern living.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "OKMADE",
  },
};

export const viewport = {
  themeColor: "#D97706",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default async function RootLayout({ children }) {
  const cookieStore = await cookies();
  const theme = cookieStore.get(THEME_COOKIE)?.value || THEME_DEFAULT;

  return (
    <html lang="en" className={theme === "dark" ? "dark" : ""}>
      <head>
        <ThemeInit />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-C7DX7WTH30"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-C7DX7WTH30');
          `}
        </Script>
        <link
          href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Lobster&family=Montserrat:wght@300;400;600&family=Open+Sans:wght@300;400;600&family=Roboto:wght@300;400;500&family=Oswald:wght@300;400;600&family=Raleway:wght@300;400;600&family=Merriweather:wght@300;400;700&family=Pacifico&family=Cormorant+Garamond:wght@400;600&family=Quicksand:wght@300;400;600&family=Work+Sans:wght@300;400;600&family=Josefin+Sans:wght@300;400;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-gray-50 dark:bg-gray-950">
        <ThemeProvider initialTheme={theme}>
          <VisitTracker />
          <PromoBanner />
          <OfflineBanner />
          <PWASetup />
          <SplashScreen />
          <InstallBanner />
          <OfflineQueueIndicator />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
