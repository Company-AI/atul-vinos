"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/infra/db/prisma";
import { createSession, destroySession } from "@/infra/auth/session";
import { hashPassword, verifyPassword } from "@/infra/auth/password";
import { clientIp, rateLimit } from "@/infra/security/rate-limit";
import { getOrCreateCart } from "@/domain/cart/service";
import { notify } from "@/domain/notifications/service";

export type AuthResult = { ok: true; redirectTo: string } | { ok: false; error: string };

const loginSchema = z.object({
  email: z.string().email("Email inválido."),
  password: z.string().min(1, "Ingresá tu contraseña."),
  next: z.string().optional(),
});

/** Login de clientes y de staff. El mismo formulario sirve para ambos. */
export async function login(input: {
  email: string;
  password: string;
  next?: string;
}): Promise<AuthResult> {
  const requestHeaders = await headers();
  const ip = clientIp(requestHeaders);

  // Límite por IP y por email: frena fuerza bruta sin bloquear a un usuario legítimo.
  const byIp = rateLimit(`login:ip:${ip}`, { limit: 20, windowSeconds: 300 });
  const byEmail = rateLimit(`login:email:${input.email.toLowerCase()}`, {
    limit: 8, windowSeconds: 300,
  });
  if (!byIp.allowed || !byEmail.allowed) {
    return { ok: false, error: "Demasiados intentos. Probá de nuevo en unos minutos." };
  }

  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase().trim() },
  });

  // Mensaje idéntico en ambos casos: no revelamos si el email existe.
  const valid = user && (await verifyPassword(parsed.data.password, user.passwordHash));
  if (!user || !valid) {
    return { ok: false, error: "Email o contraseña incorrectos." };
  }
  if (!user.isActive) {
    return { ok: false, error: "Tu cuenta está desactivada. Escribinos para reactivarla." };
  }

  await createSession({ userId: user.id, email: user.email, isStaff: user.isStaff });
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  // El carrito anónimo pasa a la cuenta.
  await getOrCreateCart();

  const fallback = user.isStaff ? "/admin" : "/mi-cuenta";
  const next = parsed.data.next && parsed.data.next.startsWith("/") ? parsed.data.next : fallback;
  return { ok: true, redirectTo: next };
}

const registerSchema = z.object({
  firstName: z.string().min(2, "Ingresá tu nombre."),
  lastName: z.string().min(2, "Ingresá tu apellido."),
  email: z.string().email("Email inválido."),
  phone: z.string().optional(),
  password: z.string().min(8, "La contraseña necesita al menos 8 caracteres."),
  acceptsMarketing: z.boolean().default(false),
  next: z.string().optional(),
});

export async function register(input: {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
  acceptsMarketing?: boolean;
  next?: string;
}): Promise<AuthResult> {
  const requestHeaders = await headers();
  const limit = rateLimit(`register:${clientIp(requestHeaders)}`, {
    limit: 5, windowSeconds: 600,
  });
  if (!limit.allowed) {
    return { ok: false, error: "Demasiados registros desde esta conexión. Probá más tarde." };
  }

  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const email = parsed.data.email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { ok: false, error: "Ya existe una cuenta con ese email. Probá ingresando." };
  }

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: await hashPassword(parsed.data.password),
      firstName: parsed.data.firstName.trim(),
      lastName: parsed.data.lastName.trim(),
      phone: parsed.data.phone?.trim() || null,
      acceptsMarketing: parsed.data.acceptsMarketing,
    },
  });

  if (parsed.data.acceptsMarketing) {
    await prisma.newsletterSubscriber.upsert({
      where: { email },
      create: { email, name: `${user.firstName} ${user.lastName}`, source: "registro" },
      update: { isActive: true },
    });
  }

  await createSession({ userId: user.id, email: user.email, isStaff: false });
  await getOrCreateCart();

  await notify(
    "auth.welcome",
    { email: user.email, name: `${user.firstName} ${user.lastName}`, userId: user.id },
    {
      subject: "Bienvenido a la bodega",
      heading: `Hola ${user.firstName}`,
      intro: "Tu cuenta está lista. Desde Mi Cuenta podés seguir tus pedidos, guardar direcciones y administrar tu suscripción al Club.",
      body: "Cuenta creada correctamente.",
      cta: {
        label: "Ver los vinos",
        url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/vinos`,
      },
    },
    { type: "User", id: user.id },
  );

  const next = parsed.data.next && parsed.data.next.startsWith("/") ? parsed.data.next : "/mi-cuenta";
  return { ok: true, redirectTo: next };
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/");
}

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Ingresá tu contraseña actual."),
  newPassword: z.string().min(8, "La nueva contraseña necesita al menos 8 caracteres."),
});

export async function changePassword(input: {
  userId: string;
  currentPassword: string;
  newPassword: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = passwordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const user = await prisma.user.findUnique({ where: { id: input.userId } });
  if (!user) return { ok: false, error: "Usuario inexistente." };

  const valid = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
  if (!valid) return { ok: false, error: "La contraseña actual no coincide." };

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(parsed.data.newPassword) },
  });

  return { ok: true };
}
