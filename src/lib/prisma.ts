import { PrismaClient } from "@prisma/client";
import path from "path";
import fs from "fs";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getDatabaseUrl(): string {
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== "") {
    return process.env.DATABASE_URL;
  }

  // Fallback for Netlify / serverless environments where .env is not loaded
  const localDbPath = path.join(process.cwd(), "prisma", "dev.db");

  // In AWS Lambda / Netlify functions, the root filesystem is read-only.
  // /tmp is writeable, so copy the pre-seeded SQLite db to /tmp if present.
  const isServerless =
    Boolean(process.env.NETLIFY) ||
    Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME) ||
    Boolean(process.env.VERCEL);

  if (isServerless) {
    const tmpDbPath = path.join("/tmp", "dev.db");
    try {
      if (!fs.existsSync(tmpDbPath) && fs.existsSync(localDbPath)) {
        fs.copyFileSync(localDbPath, tmpDbPath);
      }
      if (fs.existsSync(tmpDbPath)) {
        return `file:${tmpDbPath}`;
      }
    } catch (err) {
      console.warn("Could not copy sqlite db to /tmp:", err);
    }
  }

  return `file:${localDbPath}`;
}

const resolvedDbUrl = getDatabaseUrl();
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = resolvedDbUrl;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: resolvedDbUrl,
      },
    },
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
