import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Next.js only serves qualities listed here (default is just 75).
    qualities: [75, 85],
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
