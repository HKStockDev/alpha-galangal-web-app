import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["geist"],
  async rewrites() {
    const apiOrigin = process.env.API_PROXY_TARGET ?? "http://localhost:3001";
    return [
      {
        source: "/backend-api/:path*",
        destination: `${apiOrigin}/api/:path*`,
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/org/dashboard/legend-scores",
        destination: "/org/dashboard/investors-scores",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
