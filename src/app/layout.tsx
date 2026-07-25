import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ClientLayout } from "./client-layout";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://zerodata-two.vercel.app"),
  title: "ZeroData — Image Metadata Inspector & Remover",
  description:
    "Inspect and strip EXIF, GPS, IPTC, XMP, C2PA, and AI-generation metadata from JPEG, PNG, and WebP images. 100% client-side. Nothing leaves your device.",
  icons: {
    icon: "/ZeroData.ico",
  },
  openGraph: {
    title: "ZeroData — Image Metadata Inspector & Remover",
    description:
      "Inspect and strip EXIF, GPS, IPTC, XMP, C2PA, and AI-generation metadata from images. 100% client-side. Nothing leaves your device.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
      data-scroll-behavior="smooth"
    >
      <body className="font-sans bg-[#080808] text-[#cccccc] min-h-screen">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
