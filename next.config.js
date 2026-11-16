/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    DATABASE_URL: process.env.DATABASE_URL || "file:./prisma/dev.db",
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || "super-secret-jwt-key-splitwise-roommates-2026-auth-token",
  },
  reactStrictMode: true,
};

module.exports = nextConfig;
