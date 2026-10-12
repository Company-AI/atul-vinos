"use server";

import { z } from "zod";
import { prisma } from "@/infra/db/prisma";
import { getSettings } from "@/domain/settings/service";

const schema = z.object({
  firstName: z.string().min(2, "Decinos cómo te llamás.").max(80),
  email: z.email("Ingresá un email válido."),
});

/**
 * Ficha que deja alguien en la ventana de bienvenida a cambio del cupón.
 *
 * Crea el cliente para que aparezca en el admin, pero sin contraseña: nadie
 * eligió una. Esa cuenta queda a medio abrir y se termina de abrir sola cuando
 * la persona se registra con el mismo mail, que es lo que resuelve `register`.
 *
 * El cupón no se emite acá: es uno solo, fijo, el mismo para todos. Lo que se
 * guarda es quién lo pidió.
 */
export async function claimPromo(input: {
  firstName: string;
  email: string;
}): Promise<{ ok: true; couponCode: string } | { ok: false; error: string }> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const { promo } = await getSettings();
  if (!promo.enabled) {
    return { ok: false, error: "La promoción no está disponible." };
  }

  const email = parsed.data.email.toLowerCase().trim();
  const firstName = parsed.data.firstName.trim();

  try {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.user.findUnique({ where: { email } });

      // A quien ya tiene cuenta no se le pisa el nombre ni la preferencia.
      if (!existing) {
        await tx.user.create({
          data: { email, firstName, lastName: "", acceptsMarketing: true },
        });
      }

      await tx.newsletterSubscriber.upsert({
        where: { email },
        create: { email, name: firstName, source: "promo", consent: true, isActive: true },
        update: { isActive: true, consent: true, consentAt: new Date() },
      });
    });
  } catch {
    return { ok: false, error: "No pudimos guardar tus datos. Probá de nuevo." };
  }

  return { ok: true, couponCode: promo.couponCode };
}
