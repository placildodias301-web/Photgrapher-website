import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // All quality values used across components must be listed here.
    qualities: [75, 80, 82, 85],
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
