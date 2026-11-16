import { PrismaClient } from "@prisma/client";
import path from "path";
import fs from "fs";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getDatabaseUrl(): string {
  // If an external PostgreSQL/MySQL connection string is provided, use it directly
  if (
    process.env.DATABASE_URL &&
    !process.env.DATABASE_URL.startsWith("file:")
  ) {
    return process.env.DATABASE_URL;
  }

  const isServerless =
    Boolean(process.env.VERCEL) ||
    Boolean(process.env.NETLIFY) ||
    Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);

  // In AWS Lambda / Vercel serverless environments, the root directory is strictly read-only.
  // SQLite must create lock/journal files (.wal/.shm) which fails with Error 14 unless
  // the database file lives in the writable /tmp directory.
  if (isServerless) {
    const tmpDbPath = path.join("/tmp", "dev.db");
    const candidates = [
      path.join(process.cwd(), "prisma", "dev.db"),
      path.resolve(process.cwd(), "prisma", "dev.db"),
      path.join(__dirname, "..", "..", "prisma", "dev.db"),
      path.join("/var", "task", "prisma", "dev.db"),
    ];

    try {
      if (!fs.existsSync(tmpDbPath)) {
        for (const src of candidates) {
          if (fs.existsSync(src)) {
            fs.copyFileSync(src, tmpDbPath);
            try {
              fs.chmodSync(tmpDbPath, 0o666);
            } catch (_) {}
            break;
          }
        }
      }

      if (fs.existsSync(tmpDbPath)) {
        return `file:${tmpDbPath}`;
      }
    } catch (err) {
      console.warn("Could not initialize /tmp sqlite database:", err);
    }
  }

  // Local development default
  const localDb = path.join(process.cwd(), "prisma", "dev.db");
  return `file:${localDb}`;
}

const resolvedDbUrl = getDatabaseUrl();
process.env.DATABASE_URL = resolvedDbUrl;

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
