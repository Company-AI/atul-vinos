"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/infra/db/prisma";
import { getCurrentUser } from "@/infra/auth/session";
import { AR_PROVINCES, isValidPostalCode } from "@/lib/ar";

export type AccountResult = { ok: true; message: string } | { ok: false; error: string };

const addressSchema = z.object({
  label: z.string().max(40).optional(),
  firstName: z.string().min(2, "Ingresá el nombre."),
  lastName: z.string().min(2, "Ingresá el apellido."),
  phone: z.string().optional(),
  documentId: z.string().optional(),
  street: z.string().min(2, "Ingresá la calle."),
  number: z.string().min(1, "Ingresá la altura."),
  apartment: z.string().optional(),
  city: z.string().min(2, "Ingresá la localidad."),
  province: z.enum(AR_PROVINCES, { message: "Elegí una provincia." }),
  postalCode: z.string().refine(isValidPostalCode, "Código postal inválido."),
  reference: z.string().optional(),
  isDefaultShipping: z.boolean().default(false),
});

export async function saveAddress(
  input: z.input<typeof addressSchema> & { id?: string },
): Promise<AccountResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Ingresá a tu cuenta." };

  const parsed = addressSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Revisá los datos." };
  }
  const data = parsed.data;

  if (input.id) {
    const existing = await prisma.address.findFirst({
      where: { id: input.id, userId: user.id },
    });
    if (!existing) return { ok: false, error: "Esa dirección no está en tu cuenta." };
  }

  await prisma.$transaction(async (tx) => {
    if (data.isDefaultShipping) {
      await tx.address.updateMany({
        where: { userId: user.id },
        data: { isDefaultShipping: false },
      });
    }

    if (input.id) {
      await tx.address.update({
        where: { id: input.id },
        data: { ...data, label: data.label || null },
      });
    } else {
      await tx.address.create({
        data: { ...data, label: data.label || null, userId: user.id },
      });
    }
  });

  revalidatePath("/mi-cuenta/direcciones");
  return { ok: true, message: input.id ? "Dirección actualizada." : "Dirección guardada." };
}

export async function deleteAddress(addressId: string): Promise<AccountResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Ingresá a tu cuenta." };

  const address = await prisma.address.findFirst({
    where: { id: addressId, userId: user.id },
    include: { _count: { select: { orders: true, subscriptions: true } } },
  });
  if (!address) return { ok: false, error: "Esa dirección no está en tu cuenta." };

  if (address._count.subscriptions > 0) {
    return {
      ok: false,
      error: "Esa dirección está asignada a tu suscripción. Cambiala primero desde Mi suscripción.",
    };
  }

  // Si tiene pedidos, no se borra: los pedidos guardan su propio snapshot,
  // pero conservamos la referencia histórica.
  if (address._count.orders > 0) {
    return {
      ok: false,
      error: "Esa dirección tiene pedidos asociados. Podés editarla, pero no eliminarla.",
    };
  }

  await prisma.address.delete({ where: { id: addressId } });
  revalidatePath("/mi-cuenta/direcciones");
  return { ok: true, message: "Dirección eliminada." };
}

const profileSchema = z.object({
  firstName: z.string().min(2, "Ingresá tu nombre."),
  lastName: z.string().min(2, "Ingresá tu apellido."),
  phone: z.string().optional(),
  documentId: z.string().optional(),
  acceptsMarketing: z.boolean().default(false),
});

export async function updateProfile(
  input: z.input<typeof profileSchema>,
): Promise<AccountResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Ingresá a tu cuenta." };

  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Revisá los datos." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      firstName: parsed.data.firstName.trim(),
      lastName: parsed.data.lastName.trim(),
      phone: parsed.data.phone?.trim() || null,
      documentId: parsed.data.documentId?.trim() || null,
      acceptsMarketing: parsed.data.acceptsMarketing,
    },
  });

  revalidatePath("/mi-cuenta/datos");
  return { ok: true, message: "Datos actualizados." };
}
