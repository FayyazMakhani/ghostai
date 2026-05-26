import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

interface GlobalForPrisma {
  prisma: PrismaClient | undefined;
}

const globalForPrisma = globalThis as unknown as GlobalForPrisma;

function createClient(): PrismaClient {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  if (url.startsWith("prisma+postgres://")) {
    return new PrismaClient({ accelerateUrl: url });
  }

  const adapter = new PrismaPg({ connectionString: url });
  return new PrismaClient({ adapter });
}

// In development, skip the global cache so that HMR module reloads always get a
// fresh client with the current generated schema. Without this, the cached instance
// predates schema changes (e.g. new models) and accessing new model delegates
// returns undefined at runtime.
// In production, cache on globalThis to avoid exhausting the connection pool across
// serverless function invocations.
export const prisma: PrismaClient =
  process.env.NODE_ENV === "production"
    ? (globalForPrisma.prisma ?? (globalForPrisma.prisma = createClient()))
    : createClient();
