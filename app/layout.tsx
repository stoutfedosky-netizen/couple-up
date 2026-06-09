import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://coupleup.app"
  ),
  title: "Couple Up — Love Island USA Season 8 Bracket Predictions",
  description:
    "Predict couples, call the dumpings, compete with friends. The ultimate Love Island bracket game for Season 8.",
  keywords: [
    "Love Island",
    "Love Island USA",
    "Season 8",
    "bracket",
    "predictions",
    "couples",
    "reality TV",
    "game",
  ],
  openGraph: {
    title: "Couple Up — Love Island USA Season 8 Bracket Predictions",
    description:
      "Predict couples, call the dumpings, compete with friends. The ultimate Love Island bracket game.",
    siteName: "Couple Up",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Couple Up — Love Island USA Season 8 Bracket Predictions",
    description:
      "Predict couples, call the dumpings, compete with friends. The ultimate Love Island bracket game.",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Couple Up",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#e11d48",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="min-h-full flex flex-col bg-white text-gray-900">
        {children}
      </body>
    </html>
  );
}
