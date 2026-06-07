import "./globals.css";

export const metadata = {
  title: "OKMADE Furniture",
  description: "Custom furniture and showroom",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-50">{children}</body>
    </html>
  );
}
