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
  metadataBase: new URL("http://localhost:3000"),
  title: "ZeroData — Image Metadata Remover",
  description:
    "Strip EXIF, GPS, IPTC, XMP, and AI-generation metadata from images. 100% client-side. Nothing leaves your device.",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='6' fill='%2300e5a0'/><text x='16' y='23' text-anchor='middle' font-size='20' font-weight='bold' fill='%23080808' font-family='system-ui'>Z</text></svg>",
  },
  openGraph: {
    title: "ZeroData — Image Metadata Remover",
    description:
      "Strip EXIF, GPS, IPTC, XMP, and AI-generation metadata from images. 100% client-side. Nothing leaves your device.",
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
