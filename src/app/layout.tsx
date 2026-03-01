import type { Metadata, Viewport } from "next";
import { Castoro, Inter } from "next/font/google";
import "./globals.css";

const castoro = Castoro({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-castoro",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});
import { ServiceWorkerRegistration } from "./ServiceWorkerRegistration";
import { StoreHydration } from "@/components/StoreHydration";
import { StoreSync } from "@/components/StoreSync";
import { RealtimeSync } from "@/components/RealtimeSync";
import { AuthProvider } from "@/components/AuthProvider";
import { OfflineBanner } from "@/components/OfflineBanner";
import { DevTestSeam } from "@/components/DevTestSeam";
import { IOSDynamicSplashScreen } from "@/components/IOSDynamicSplashScreen";

export const metadata: Metadata = {
  title: "Did we get...?",
  description: "Weekly meal planning made simple",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Did we get...?",
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#5b806e", // keep in sync with --primary in tokens.css
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${castoro.variable} ${inter.variable}`}>
      <body className="antialiased">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <AuthProvider>
          <OfflineBanner />
          <StoreHydration />
          <StoreSync />
          <RealtimeSync />
          <DevTestSeam />
          <IOSDynamicSplashScreen />
          {children}
        </AuthProvider>
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
