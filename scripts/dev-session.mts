/**
 * Imprime una cookie de sesión válida para probar el admin con curl o scripts.
 * Solo para desarrollo.
 *
 *   npx tsx scripts/dev-session.mts [email]
 */
import { config } from "dotenv";
import { SignJWT } from "jose";
import { PrismaClient } from "@prisma/client";

config({ path: ".env" });

if (process.env.NODE_ENV === "production") {
  console.error("Este script no está disponible en producción.");
  process.exit(1);
}

const email = process.argv[2] ?? "admin@auroraseleccion.test";
const prisma = new PrismaClient();

const user = await prisma.user.findUnique({ where: { email } });
if (!user) {
  console.error(`No existe el usuario ${email}. Corré npm run db:seed primero.`);
  process.exit(1);
}

const token = await new SignJWT({
  userId: user.id,
  email: user.email,
  isStaff: user.isStaff,
})
  .setProtectedHeader({ alg: "HS256" })
  .setIssuedAt()
  .setExpirationTime("2h")
  .sign(new TextEncoder().encode(process.env.AUTH_SECRET!));

console.log(token);
await prisma.$disconnect();
