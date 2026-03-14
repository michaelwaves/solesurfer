import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: {
      fs: "./lib/empty-module.js",
    },
  },
};

export default nextConfig;
