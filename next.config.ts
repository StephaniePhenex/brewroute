import type { NextConfig } from "next";

// Pin the workspace root to this repo so a stray lockfile higher up the
// filesystem (e.g. ~/package-lock.json) is never inferred as the root.
const nextConfig: NextConfig = {
  outputFileTracingRoot: __dirname,
  turbopack: { root: __dirname },
};

export default nextConfig;
