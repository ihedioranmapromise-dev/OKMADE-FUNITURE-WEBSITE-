import "./globals.css";

export const metadata = {
  title: "OKMADE Furniture",
  description: "Custom furniture and showroom",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-gray-50">{children}</body>
    </html>
  );
}
