import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  
  images: {
    remotePatterns: [
    {
      protocol: 'https',
      hostname: 'googleusercontent.com',
    },
      {
      protocol: 'https',
      hostname: 'firebasestorage.googleapis.com',
    },
  ],
    // domains: ["lh3.googleusercontent.com", "firebasestorage.googleapis.com"],
  },
   turbopack: {},
};

export default nextConfig;