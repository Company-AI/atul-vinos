"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/infra/db/prisma";
import { assertPermission } from "@/infra/auth/guards";
import { recordAudit } from "@/domain/audit/service";
import { postalCodeNumber } from "@/lib/ar";
import { listShippingProviders } from "@/infra/shipping/registry";

export type ShippingActionResult = { ok: true; message: string } | { ok: false; error: string };

const zoneSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Ingresá el nombre de la zona."),
  provinces: z.array(z.string()).default([]),
  cities: z.array(z.string()).default([]),
  /* Rango de códigos postales: cuatro dígitos o un CPA, del que se usa el número. */
  postalCodeFrom: z.string().nullable().optional(),
  postalCodeTo: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
  rates: z
    .array(
      z.object({
        id: z.string().optional(),
        name: z.string().min(2, "Cada tarifa necesita un nombre."),
        price: z.number().min(0),
        freeFrom: z.number().min(0).nullable().optional(),
        etaMinDays: z.number().int().min(0).nullable().optional(),
        etaMaxDays: z.number().int().min(0).nullable().optional(),
        carrierCode: z.string().optional(),
        isActive: z.boolean().default(true),
      }),
    )
    .default([]),
});

export async function saveShippingZone(
  input: z.input<typeof zoneSchema>,
): Promise<ShippingActionResult> {
  let user;
  try {
    user = await assertPermission("settings.edit");
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Sin permiso." };
  }

  const parsed = zoneSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Revisá los datos de la zona." };
  }
  const data = parsed.data;

  if (data.rates.length === 0) {
    return { ok: false, error: "La zona necesita al menos una tarifa." };
  }

  const carriers = await prisma.carrier.findMany();
  const carrierByCode = new Map(carriers.map((c) => [c.code, c.id]));

  const zoneId = await prisma.$transaction(async (tx) => {
    const payload = {
      name: data.name.trim(),
      provinces: data.provinces.map((p) => p.trim()).filter(Boolean),
      cities: data.cities.map((c) => c.trim()).filter(Boolean),
      /*
        Se guarda normalizado a cuatro dígitos: si alguien pega un CPA entero
        el rango igual tiene que poder compararse contra el CP que escriba un
        cliente, que casi siempre son cuatro números pelados.
      */
      postalCodeFrom: data.postalCodeFrom ? String(postalCodeNumber(data.postalCodeFrom) ?? "") || null : null,
      postalCodeTo: data.postalCodeTo ? String(postalCodeNumber(data.postalCodeTo) ?? "") || null : null,
      isActive: data.isActive,
      sortOrder: data.sortOrder,
    };

    const zone = data.id
      ? await tx.shippingZone.update({ where: { id: data.id }, data: payload })
      : await tx.shippingZone.create({ data: payload });

    await tx.shippingRate.deleteMany({ where: { zoneId: zone.id } });
    await tx.shippingRate.createMany({
      data: data.rates.map((rate, index) => ({
        zoneId: zone.id,
        name: rate.name.trim(),
        price: rate.price,
        freeFrom: rate.freeFrom ?? null,
        etaMinDays: rate.etaMinDays ?? null,
        etaMaxDays: rate.etaMaxDays ?? null,
        carrierId: rate.carrierCode ? (carrierByCode.get(rate.carrierCode) ?? null) : null,
        isActive: rate.isActive,
        sortOrder: (index + 1) * 10,
      })),
    });

    return zone.id;
  });

  await recordAudit(user, {
    action: "settings.update",
    entityType: "ShippingZone",
    entityId: zoneId,
    after: { name: data.name, rates: data.rates.length },
  });

  revalidatePath("/admin/envios");
  return { ok: true, message: data.id ? "Zona actualizada." : "Zona creada." };
}

export async function deleteShippingZone(zoneId: string): Promise<ShippingActionResult> {
  let user;
  try {
    user = await assertPermission("settings.edit");
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Sin permiso." };
  }

  await prisma.shippingZone.delete({ where: { id: zoneId } });
  await recordAudit(user, {
    action: "settings.update",
    entityType: "ShippingZone",
    entityId: zoneId,
    after: { deleted: true },
  });

  revalidatePath("/admin/envios");
  return { ok: true, message: "Zona eliminada." };
}

export async function toggleCarrier(carrierCode: string): Promise<ShippingActionResult> {
  let user;
  try {
    user = await assertPermission("settings.edit");
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Sin permiso." };
  }

  const carrier = await prisma.carrier.findUnique({ where: { code: carrierCode } });
  if (!carrier) return { ok: false, error: "El transportista no existe." };

  await prisma.carrier.update({
    where: { code: carrierCode },
    data: { isActive: !carrier.isActive },
  });

  await recordAudit(user, {
    action: "settings.update",
    entityType: "Carrier",
    entityId: carrier.id,
    before: { isActive: carrier.isActive },
    after: { isActive: !carrier.isActive },
  });

  revalidatePath("/admin/envios");
  return {
    ok: true,
    message: carrier.isActive ? `${carrier.name} desactivado.` : `${carrier.name} activado.`,
  };
}

/**
 * Prueba la conexión con un transportista externo.
 *
 * Existe porque la integración se escribió sin poder ejecutarla: las
 * credenciales de Andreani sólo se generan teniendo cuenta. El día que estén
 * cargadas, esto dice en un clic si la llamada entra o qué devolvió, en vez de
 * descubrirlo cuando un cliente intenta comprar.
 *
 * Cotiza contra un código postal real y una botella, que es el pedido más
 * chico posible. No crea nada: sólo pregunta un precio.
 */
export async function probarTransportista(
  code: string,
  postalCode = "1425",
): Promise<ShippingActionResult> {
  try {
    await assertPermission("settings.edit");
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Sin permiso." };
  }

  const provider = listShippingProviders().find((p) => p.code === code);
  if (!provider) return { ok: false, error: "No conocemos ese transportista." };

  if (!provider.isConfigured()) {
    return {
      ok: false,
      error: `${provider.name} no tiene credenciales cargadas en el entorno del servidor.`,
    };
  }

  try {
    const quotes = await provider.quote(
      { postalCode, city: "", province: "" },
      { bottles: 1, weightGrams: 1500, declaredValue: 0 },
    );
    if (quotes.length === 0) {
      return { ok: false, error: `${provider.name} respondió, pero sin ninguna tarifa.` };
    }
    return {
      ok: true,
      message: `${provider.name} respondió: ${quotes[0].serviceName}, ${quotes[0].price}.`,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : `Falló la llamada a ${provider.name}.`,
    };
  }
}
