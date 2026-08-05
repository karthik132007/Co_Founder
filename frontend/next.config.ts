import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained build output (`.next/standalone`) so the Docker image only
  // ships the server + static assets, not the full node_modules.
  output: "standalone",
  async redirects() {
    return [
      {
        source: "/landing",
        destination: "/",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
