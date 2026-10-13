import { z } from "zod";
import { prisma } from "@/infra/db/prisma";
import { getSettings } from "@/domain/settings/service";
import { edadEnAnios, fechaDeNacimiento } from "./edad";

const schema = z.object({
  firstName: z.string().min(2, "Decinos cómo te llamás.").max(80),
  email: z.email("Ingresá un email válido."),
  birthDate: z.string().min(1, "Ingresá tu fecha de nacimiento."),
});

export type CampoDeBienvenida = "firstName" | "email" | "birthDate";

export type ResultadoDeBienvenida =
  | { ok: true; couponCode: string }
  | { ok: false; error: string; field?: CampoDeBienvenida };

/**
 * La ficha que deja alguien en la ventana de bienvenida a cambio del cupón.
 *
 * Crea el cliente para que aparezca en el admin, pero sin contraseña: nadie
 * eligió una. Esa cuenta queda a medio abrir y se termina de abrir sola
 * cuando la persona se registra con el mismo mail, que es lo que resuelve
 * `register`.
 *
 * El cupón no se emite acá: es uno solo, fijo, el mismo para todos, y sus
 * reglas —un uso por persona, sólo primera compra— viven en el cupón y las
 * aplica el checkout al validarlo. Lo que se guarda es quién lo pidió.
 *
 * Está en el dominio y no en la server action porque la acción necesita
 * `headers()` para limitar por IP, y eso la vuelve imposible de probar fuera
 * de un request. Acá adentro está la decisión; afuera, el torniquete.
 */
export async function registrarBienvenida(input: {
  firstName: string;
  email: string;
  birthDate: string;
}): Promise<ResultadoDeBienvenida> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      ok: false,
      error: issue?.message ?? "Datos inválidos.",
      field: issue?.path[0] as CampoDeBienvenida | undefined,
    };
  }

  const { promo, ageGate } = await getSettings();
  if (!promo.enabled) {
    return { ok: false, error: "La promoción no está disponible." };
  }

  const nacimiento = fechaDeNacimiento(parsed.data.birthDate);
  if (!nacimiento) {
    return { ok: false, error: "Revisá la fecha de nacimiento.", field: "birthDate" };
  }

  /*
    Se chequea acá aunque el campo del formulario ya tenga un tope: el `max`
    del input es una comodidad del navegador y se saltea mandando el pedido a
    mano. Se vende alcohol, así que la decisión se toma de este lado.
  */
  if (edadEnAnios(nacimiento) < ageGate.minAge) {
    return {
      ok: false,
      error: `Tenés que ser mayor de ${ageGate.minAge} años.`,
      field: "birthDate",
    };
  }

  const email = parsed.data.email.toLowerCase().trim();
  const firstName = parsed.data.firstName.trim();

  try {
    await prisma.$transaction(async (tx) => {
      const existente = await tx.user.findUnique({
        where: { email },
        select: { id: true, birthDate: true },
      });

      if (existente) {
        /*
          A quien ya tiene cuenta no se le pisa el nombre ni la preferencia de
          marketing: las eligió él. La fecha sí se completa si faltaba, porque
          es un dato que antes no se pedía.
        */
        if (!existente.birthDate) {
          await tx.user.update({ where: { id: existente.id }, data: { birthDate: nacimiento } });
        }
      } else {
        await tx.user.create({
          data: {
            email,
            firstName,
            lastName: "",
            birthDate: nacimiento,
            acceptsMarketing: true,
            source: "bienvenida",
          },
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
