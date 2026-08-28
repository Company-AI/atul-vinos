"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/infra/db/prisma";
import { getCurrentUser } from "@/infra/auth/session";
import {
  cancelSubscription, changePlan, pauseSubscription, resumeSubscription,
  skipNextCycle, startSubscription,
} from "@/domain/subscriptions/service";
import { AR_PROVINCES, isValidPostalCode } from "@/lib/ar";

export type SubscriptionActionResult =
  | { ok: true; message?: string; redirectUrl?: string | null }
  | { ok: false; error: string };

const signupSchema = z.object({
  planId: z.string().min(1),
  contact: z.object({
    firstName: z.string().min(2, "Ingresá tu nombre."),
    lastName: z.string().min(2, "Ingresá tu apellido."),
    email: z.string().email("Email inválido."),
    phone: z.string().min(6, "Ingresá un teléfono."),
    documentId: z.string().optional(),
  }),
  address: z.object({
    street: z.string().min(2, "Ingresá la calle."),
    number: z.string().min(1, "Ingresá la altura."),
    apartment: z.string().optional(),
    city: z.string().min(2, "Ingresá la localidad."),
    province: z.enum(AR_PROVINCES, { message: "Elegí una provincia." }),
    postalCode: z.string().refine(isValidPostalCode, "Código postal inválido."),
    reference: z.string().optional(),
  }),
});

/** Alta al Club. Requiere cuenta: la suscripción es un contrato nominal. */
export async function subscribeToPlan(
  input: z.input<typeof signupSchema>,
): Promise<SubscriptionActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Ingresá a tu cuenta para suscribirte." };

  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Revisá los datos." };
  }

  const result = await startSubscription({
    userId: user.id,
    planId: parsed.data.planId,
    contact: parsed.data.contact,
    address: parsed.data.address,
  });

  if (!result.ok) return { ok: false, error: result.error };

  revalidatePath("/mi-cuenta/suscripcion");
  return { ok: true, redirectUrl: result.data.redirectUrl };
}

/** Todas las acciones de autogestión validan que la suscripción sea del usuario. */
async function ownSubscription(subscriptionId: string) {
  const user = await getCurrentUser();
  if (!user) return { user: null, subscription: null };
  const subscription = await prisma.subscription.findFirst({
    where: { id: subscriptionId, userId: user.id },
  });
  return { user, subscription };
}

export async function pauseMySubscription(subscriptionId: string): Promise<SubscriptionActionResult> {
  const { user, subscription } = await ownSubscription(subscriptionId);
  if (!user || !subscription) return { ok: false, error: "No encontramos tu suscripción." };

  const result = await pauseSubscription(subscriptionId);
  if (!result.ok) return { ok: false, error: result.error };

  revalidatePath("/mi-cuenta/suscripcion");
  return { ok: true, message: "Tu suscripción quedó en pausa." };
}

export async function resumeMySubscription(subscriptionId: string): Promise<SubscriptionActionResult> {
  const { user, subscription } = await ownSubscription(subscriptionId);
  if (!user || !subscription) return { ok: false, error: "No encontramos tu suscripción." };

  const result = await resumeSubscription(subscriptionId);
  if (!result.ok) return { ok: false, error: result.error };

  revalidatePath("/mi-cuenta/suscripcion");
  return { ok: true, message: "Tu suscripción está activa otra vez." };
}

export async function cancelMySubscription(
  subscriptionId: string,
  reason?: string,
): Promise<SubscriptionActionResult> {
  const { user, subscription } = await ownSubscription(subscriptionId);
  if (!user || !subscription) return { ok: false, error: "No encontramos tu suscripción." };

  const result = await cancelSubscription(subscriptionId, reason ?? null);
  if (!result.ok) return { ok: false, error: result.error };

  revalidatePath("/mi-cuenta/suscripcion");
  return { ok: true, message: "Cancelamos tu suscripción. Tu historial queda disponible." };
}

export async function changeMyPlan(
  subscriptionId: string,
  planId: string,
): Promise<SubscriptionActionResult> {
  const { user, subscription } = await ownSubscription(subscriptionId);
  if (!user || !subscription) return { ok: false, error: "No encontramos tu suscripción." };

  const result = await changePlan(subscriptionId, planId);
  if (!result.ok) return { ok: false, error: result.error };

  revalidatePath("/mi-cuenta/suscripcion");
  return { ok: true, message: "Listo. El cambio se aplica en tu próximo envío." };
}

export async function skipMyNextShipment(
  subscriptionId: string,
  skip: boolean,
): Promise<SubscriptionActionResult> {
  const { user, subscription } = await ownSubscription(subscriptionId);
  if (!user || !subscription) return { ok: false, error: "No encontramos tu suscripción." };

  const result = await skipNextCycle(subscriptionId, skip);
  if (!result.ok) return { ok: false, error: result.error };

  revalidatePath("/mi-cuenta/suscripcion");
  return {
    ok: true,
    message: skip
      ? "Vamos a omitir tu próximo envío."
      : "Tu próximo envío vuelve a estar programado.",
  };
}

/** Cambio de dirección de envío del Club. */
export async function updateSubscriptionAddress(
  subscriptionId: string,
  addressId: string,
): Promise<SubscriptionActionResult> {
  const { user, subscription } = await ownSubscription(subscriptionId);
  if (!user || !subscription) return { ok: false, error: "No encontramos tu suscripción." };

  const address = await prisma.address.findFirst({
    where: { id: addressId, userId: user.id },
  });
  if (!address) return { ok: false, error: "Esa dirección no está en tu cuenta." };

  await prisma.$transaction([
    prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        addressId: address.id,
        shippingSnapshot: {
          firstName: address.firstName,
          lastName: address.lastName,
          phone: address.phone ?? "",
          documentId: address.documentId ?? "",
          street: address.street,
          number: address.number,
          apartment: address.apartment ?? "",
          city: address.city,
          province: address.province,
          postalCode: address.postalCode,
          reference: address.reference ?? "",
        },
      },
    }),
    prisma.subscriptionEvent.create({
      data: {
        subscriptionId,
        type: "address_changed",
        message: `Dirección de envío actualizada a ${address.street} ${address.number}, ${address.city}`,
      },
    }),
  ]);

  revalidatePath("/mi-cuenta/suscripcion");
  return { ok: true, message: "Actualizamos la dirección de tus próximos envíos." };
}
