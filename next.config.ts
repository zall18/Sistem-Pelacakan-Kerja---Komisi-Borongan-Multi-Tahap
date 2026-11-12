import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false, // Helps camera barcode reader avoid double-mount issues
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;

