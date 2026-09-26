import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // A stray lockfile in the parent folder otherwise makes Turbopack guess the wrong workspace root.
  turbopack: { root: path.resolve(__dirname) },
  outputFileTracingRoot: path.resolve(__dirname),
  // The dev badge lands in review screenshots; nothing else needs it.
  devIndicators: false,
  // Landing photography is hotlinked from Unsplash under its free licence, credited in the footer.
  images: { remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }] },
};

export default nextConfig;
