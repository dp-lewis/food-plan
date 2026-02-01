import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Food Plan",
  description: "Weekly meal planning made simple",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
