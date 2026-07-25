import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const csp = [
  "default-src 'self'",
  isDev
    ? "script-src 'self' 'unsafe-eval' 'unsafe-inline'"
    : "script-src 'self' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob:",
  "font-src 'self' https://fonts.gstatic.com",
  // In dev, also allow the local network IP so phones on the same WiFi can
  // load HMR and fetch requests without CORS blocks.
  isDev
    ? "connect-src 'self' ws://192.168.1.36:3000 http://192.168.1.36:3000 https://huggingface.co https://cdn-lfs*.huggingface.co https://cdn-lfs-us-1.hf.co https://*.huggingface.co"
    : "connect-src 'self' https://huggingface.co https://cdn-lfs*.huggingface.co https://cdn-lfs-us-1.hf.co https://*.huggingface.co",
  "worker-src 'self' blob:",
  "media-src 'self' blob:",
].join("; ");

const nextConfig: NextConfig = {
  transpilePackages: ["@huggingface/transformers", "@contentauth/c2pa-web"],
  // Allow phones/tablets on the local WiFi network to access the dev server.
  // Without this, Next.js blocks cross-origin requests from the LAN IP,
  // which prevents React from hydrating — buttons appear but onClick never fires.
  allowedDevOrigins: ["192.168.1.36"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Content-Security-Policy", value: csp },
        ],
      },
    ];
  },
};

export default nextConfig;
