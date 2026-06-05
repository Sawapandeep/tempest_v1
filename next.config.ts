import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.mapillary.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
    ],
  },
  // Next 16: maplibre-gl resolves correctly out of the box.
  // The webpack alias workaround from Next 15 is no longer needed.
  //
  // Turbopack (stable in Next 16) is the default bundler for `next dev`.
  // If you need a Turbopack-specific alias you can add:
  // experimental: {
  //   turbo: {
  //     resolveAlias: { "maplibre-gl": "maplibre-gl" },
  //   },
  // },
};

export default nextConfig;