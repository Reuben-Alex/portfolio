import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Frozen at build time: the trace's time axis ends at the build month.
  env: {
    NEXT_PUBLIC_BUILD_DAY: new Date().toISOString().slice(0, 10),
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
