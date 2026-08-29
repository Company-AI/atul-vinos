"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/infra/db/prisma";
import { assertPermission } from "@/infra/auth/guards";
import { recordAudit } from "@/domain/audit/service";

export type CouponActionResult =
  | { ok: true; message: string; id?: string }
  | { ok: false; error: string };

const schema = z.object({
  id: z.string().optional(),
  code: z.string().min(3, "El código necesita al menos 3 caracteres."),
  type: z.enum(["PERCENT", "FIXED", "FREE_SHIPPING"]),
  value: z.number().min(0),
  description: z.string().max(200).optional(),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  minPurchase: z.number().min(0).nullable().optional(),
  maxUses: z.number().int().min(1).nullable().optional(),
  maxUsesPerUser: z.number().int().min(1).nullable().optional(),
  clubMembersOnly: z.boolean().default(false),
  firstPurchaseOnly: z.boolean().default(false),
  isActive: z.boolean().default(true),
  productIds: z.array(z.string()).default([]),
  categoryIds: z.array(z.string()).default([]),
});

export async function saveCoupon(input: z.input<typeof schema>): Promise<CouponActionResult> {
  let user;
  try {
    user = await assertPermission("coupons.edit");
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Sin permiso." };
  }

  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Revisá los datos del cupón." };
  }
  const data = parsed.data;
  const code = data.code.trim().toUpperCase();

  if (data.type === "PERCENT" && (data.value <= 0 || data.value > 100)) {
    return { ok: false, error: "El porcentaje tiene que estar entre 1 y 100." };
  }
  if (data.type === "FIXED" && data.value <= 0) {
    return { ok: false, error: "Ingresá el monto del descuento." };
  }

  const existing = await prisma.coupon.findUnique({ where: { code } });
  if (existing && existing.id !== data.id) {
    return { ok: false, error: `Ya existe un cupón con el código ${code}.` };
  }

  const payload = {
    code,
    type: data.type,
    value: data.type === "FREE_SHIPPING" ? 0 : data.value,
    description: data.description?.trim() || null,
    startsAt: data.startsAt ? new Date(`${data.startsAt}T00:00:00`) : null,
    endsAt: data.endsAt ? new Date(`${data.endsAt}T23:59:59`) : null,
    minPurchase: data.minPurchase ?? null,
    maxUses: data.maxUses ?? null,
    maxUsesPerUser: data.maxUsesPerUser ?? null,
    clubMembersOnly: data.clubMembersOnly,
    firstPurchaseOnly: data.firstPurchaseOnly,
    isActive: data.isActive,
  };

  const couponId = await prisma.$transaction(async (tx) => {
    const before = data.id ? await tx.coupon.findUnique({ where: { id: data.id } }) : null;

    const coupon = data.id
      ? await tx.coupon.update({ where: { id: data.id }, data: payload })
      : await tx.coupon.create({ data: payload });

    await tx.couponProduct.deleteMany({ where: { couponId: coupon.id } });
    await tx.couponCategory.deleteMany({ where: { couponId: coupon.id } });

    if (data.productIds.length) {
      await tx.couponProduct.createMany({
        data: data.productIds.map((productId) => ({ couponId: coupon.id, productId })),
      });
    }
    if (data.categoryIds.length) {
      await tx.couponCategory.createMany({
        data: data.categoryIds.map((categoryId) => ({ couponId: coupon.id, categoryId })),
      });
    }

    await recordAudit(user, {
      action: data.id ? "coupon.update" : "coupon.create",
      entityType: "Coupon",
      entityId: coupon.id,
      before: before ? { code: before.code, value: Number(before.value), isActive: before.isActive } : undefined,
      after: { code, value: data.value, isActive: data.isActive },
    });

    return coupon.id;
  });

  revalidatePath("/admin/cupones");
  return { ok: true, message: data.id ? "Cupón actualizado." : "Cupón creado.", id: couponId };
}

export async function toggleCoupon(couponId: string): Promise<CouponActionResult> {
  let user;
  try {
    user = await assertPermission("coupons.edit");
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Sin permiso." };
  }

  const coupon = await prisma.coupon.findUnique({ where: { id: couponId } });
  if (!coupon) return { ok: false, error: "El cupón no existe." };

  await prisma.coupon.update({
    where: { id: couponId },
    data: { isActive: !coupon.isActive },
  });

  await recordAudit(user, {
    action: "coupon.update",
    entityType: "Coupon",
    entityId: couponId,
    before: { isActive: coupon.isActive },
    after: { isActive: !coupon.isActive },
  });

  revalidatePath("/admin/cupones");
  return {
    ok: true,
    message: coupon.isActive ? `${coupon.code} desactivado.` : `${coupon.code} activado.`,
  };
}
