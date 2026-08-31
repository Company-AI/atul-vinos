import { PrismaClient } from "@prisma/client";

/*
  Sin DATABASE_URL, Prisma tira un error de validación de schema que no dice
  nada útil en los logs de la plataforma. Este chequeo falla igual, pero
  explicando qué falta y dónde cargarlo.
*/
if (!process.env.DATABASE_URL) {
  throw new Error(
    "Falta la variable DATABASE_URL. Cargala en las variables de entorno del " +
      "proveedor (Netlify: Site configuration → Environment variables) con la " +
      "URL de Postgres con pooler. Los pasos están en SETUP-DEMO.md.",
  );
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export type { Prisma } from "@prisma/client";
