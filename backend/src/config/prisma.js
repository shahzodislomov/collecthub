import { PrismaClient } from "@prisma/client";
import { env } from "./env.js";

const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.__collecthubPrisma ??
  new PrismaClient({
    log:
      env.NODE_ENV === "development"
        ? ["warn", "error"]
        : ["error"],
  });

if (env.NODE_ENV !== "production") {
  globalForPrisma.__collecthubPrisma = prisma;
}

export async function connectDatabase() {
  await prisma.$connect();
  console.log("PostgreSQL connected");
}

export async function disconnectDatabase() {
  await prisma.$disconnect();
  console.log("PostgreSQL disconnected");
}