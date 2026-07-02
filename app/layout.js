import "./globals.css";
import Script from "next/script";

export const metadata = {
  title: "OKMADE Furniture",
  description: "Custom furniture and showroom – handcrafted pieces for modern living.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Google Analytics */}
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
        {/* Google Font (already in use) */}
        <link
          href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-gray-50">{children}</body>
    </html>
  );
}
