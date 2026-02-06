import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "InstantDownloader - Download Instagram & StarMaker Content",
  description: "Download Instagram posts, reels, stories & StarMaker songs instantly in HD. Just paste the URL and save your favorite content.",
  keywords: ["instagram downloader", "starmaker downloader", "instagram reels", "starmaker songs", "video downloader"],
  authors: [{ name: "ROHANTA" }],
  manifest: '/manifest.webmanifest',
  openGraph: {
    title: "InstantDownloader - Download Instagram & StarMaker Content",
    description: "Download Instagram posts, reels, stories & StarMaker songs instantly in HD.",
    type: "website",
  },
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${outfit.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
