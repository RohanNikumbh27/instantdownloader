import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "InstantDownloader - Download Instagram Posts & Stories",
  description: "Download Instagram posts, reels, and stories instantly. Just paste the URL and save your favorite content.",
  keywords: ["instagram downloader", "instagram posts", "instagram stories", "download instagram", "save instagram"],
  authors: [{ name: "ROHANTA" }],
  openGraph: {
    title: "InstantDownloader - Download Instagram Posts & Stories",
    description: "Download Instagram posts, reels, and stories instantly. Just paste the URL and save your favorite content.",
    type: "website",
  },
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
