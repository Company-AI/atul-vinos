/**
 * Crea o actualiza el usuario administrador.
 *
 * Existe porque el seed de inicialización no se puede correr dos veces: la base
 * de producción ya tiene permisos, roles y configuración, y volver a pasarlo
 * falla por claves duplicadas. Esto toca una sola fila.
 *
 * Es idempotente: si el correo ya existe le cambia la contraseña y le asegura
 * el rol, y si no existe lo crea. Sirve igual para el primer acceso que para
 * rotar la clave el día que haga falta.
 *
 *   SEED_ADMIN_EMAIL=... SEED_ADMIN_PASSWORD=... npx tsx prisma/ops/admin.ts
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error("Faltan SEED_ADMIN_EMAIL y SEED_ADMIN_PASSWORD.");
  }
  /*
    Ocho caracteres es poco, pero el piso existe para atajar el caso real: una
    variable que quedó vacía o con un valor de prueba.
  */
  if (password.length < 8) {
    throw new Error("La contraseña es demasiado corta.");
  }

  const rol = await prisma.role.findUnique({ where: { slug: "super_admin" } });
  if (!rol) {
    throw new Error(
      "No existe el rol super_admin: la base todavía no se inicializó. " +
        "Corré primero el workflow «Inicializar base».",
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const usuario = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      isStaff: true,
      isActive: true,
      roleId: rol.id,
    },
    create: {
      email,
      passwordHash,
      firstName: "Administrador",
      lastName: "Atul",
      isStaff: true,
      isActive: true,
      roleId: rol.id,
      emailVerifiedAt: new Date(),
    },
  });

  /* Nunca se imprime la contraseña: quien la corre ya la tiene. */
  console.log(`✓ Administrador listo: ${usuario.email}`);
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
