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
        {/* Google Fonts for stories and design */}
        <link
          href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Lobster&family=Montserrat:wght@300;400;600&family=Open+Sans:wght@300;400;600&family=Roboto:wght@300;400;500&family=Oswald:wght@300;400;600&family=Raleway:wght@300;400;600&family=Merriweather:wght@300;400;700&family=Pacifico&family=Cormorant+Garamond:wght@400;600&family=Quicksand:wght@300;400;600&family=Work+Sans:wght@300;400;600&family=Josefin+Sans:wght@300;400;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-gray-50">{children}</body>
    </html>
  );
}