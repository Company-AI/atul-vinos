import { PrismaClient } from "@prisma/client";

/*
  Sin DATABASE_URL el sitio corre en modo demo y los servicios de lectura no
  llegan hasta acá (ver src/infra/demo). El cliente se instancia igual porque
  hay módulos que lo importan aunque no lo usen; si algo intenta consultar de
  verdad, Prisma falla con su propio error, que es lo correcto: significa que
  quedó un camino de escritura sin cubrir.
*/

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export type { Prisma } from "@prisma/client";
