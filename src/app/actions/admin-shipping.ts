"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/infra/db/prisma";
import { assertPermission } from "@/infra/auth/guards";
import { recordAudit } from "@/domain/audit/service";

export type ShippingActionResult = { ok: true; message: string } | { ok: false; error: string };

const zoneSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Ingresá el nombre de la zona."),
  provinces: z.array(z.string()).default([]),
  cities: z.array(z.string()).default([]),
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
