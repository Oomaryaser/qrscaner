import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
    typescript: {
        ignoreBuildErrors: true,
    },
    outputFileTracingRoot: __dirname,
};

export default nextConfig;
