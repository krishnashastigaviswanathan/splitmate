/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || "super-secret-jwt-key-splitwise-roommates-2026-auth-token",
  },
  experimental: {
    outputFileTracingIncludes: {
      "/**": ["./prisma/dev.db"],
    },
  },
  reactStrictMode: true,
};

module.exports = nextConfig;
