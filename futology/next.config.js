/** @type {import('next').NextConfig} */
const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});

const isExport = process.env.NEXT_OUTPUT === "export";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "media.api-sports.io" },
      { protocol: "https", hostname: "crests.football-data.org" },
      { protocol: "https", hostname: "img.a.transfermarkt.technology" },
    ],
  },
  ...(isExport
    ? {
        output: "export",
        trailingSlash: true,
        ...(basePath ? { basePath, assetPrefix: `${basePath}/` } : {}),
      }
    : {}),
};

module.exports = withPWA(nextConfig);
