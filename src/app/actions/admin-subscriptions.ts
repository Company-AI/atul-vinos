"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/infra/db/prisma";
import { assertPermission } from "@/infra/auth/guards";
import { recordAudit } from "@/domain/audit/service";
import {
  cancelSubscription, changePlan, pauseSubscription, resumeSubscription,
} from "@/domain/subscriptions/service";
import { slugify, uniqueSlug } from "@/lib/slug";
import { toNumber } from "@/lib/money";

export type AdminSubscriptionResult =
  | { ok: true; message: string; id?: string }
  | { ok: false; error: string };

// ═══════════════════════════ Suscripciones ══════════════════════════════════

export async function adminPauseSubscription(id: string): Promise<AdminSubscriptionResult> {
  let user;
  try {
    user = await assertPermission("subscriptions.edit");
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Sin permiso." };
  }

  const result = await pauseSubscription(id, user.email);
  if (!result.ok) return { ok: false, error: result.error };

  await recordAudit(user, { action: "subscription.pause", entityType: "Subscription", entityId: id });
  revalidatePath(`/admin/suscripciones/${id}`);
  revalidatePath("/admin/suscripciones");
  return { ok: true, message: "Suscripción pausada." };
}

export async function adminResumeSubscription(id: string): Promise<AdminSubscriptionResult> {
  let user;
  try {
    user = await assertPermission("subscriptions.edit");
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Sin permiso." };
  }

  const result = await resumeSubscription(id, user.email);
  if (!result.ok) return { ok: false, error: result.error };

  await recordAudit(user, { action: "subscription.resume", entityType: "Subscription", entityId: id });
  revalidatePath(`/admin/suscripciones/${id}`);
  return { ok: true, message: "Suscripción reactivada." };
}

export async function adminCancelSubscription(
  id: string,
  reason?: string,
): Promise<AdminSubscriptionResult> {
  let user;
  try {
    user = await assertPermission("subscriptions.edit");
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Sin permiso." };
  }

  const result = await cancelSubscription(id, reason ?? null, user.email);
  if (!result.ok) return { ok: false, error: result.error };

  await recordAudit(user, {
    action: "subscription.cancel",
    entityType: "Subscription",
    entityId: id,
    after: { reason },
  });
  revalidatePath(`/admin/suscripciones/${id}`);
  revalidatePath("/admin/suscripciones");
  return { ok: true, message: "Suscripción cancelada. El historial queda intacto." };
}

export async function adminChangePlan(
  id: string,
  planId: string,
): Promise<AdminSubscriptionResult> {
  let user;
  try {
    user = await assertPermission("subscriptions.edit");
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Sin permiso." };
  }

  const result = await changePlan(id, planId, user.email);
  if (!result.ok) return { ok: false, error: result.error };

  await recordAudit(user, {
    action: "subscription.plan_change",
    entityType: "Subscription",
    entityId: id,
    after: { planId },
  });
  revalidatePath(`/admin/suscripciones/${id}`);
  return { ok: true, message: "Plan actualizado. Aplica desde el próximo ciclo." };
}

// ═════════════════════════════ Planes ═══════════════════════════════════════

const planSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Ingresá el nombre del plan."),
  slug: z.string().optional(),
  tagline: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  price: z.number().min(0, "El precio no puede ser negativo."),
  frequency: z.enum(["MONTHLY", "BIMONTHLY", "QUARTERLY"]).default("MONTHLY"),
  bottleCount: z.number().int().min(1, "Indicá cuántas botellas incluye."),
  imageUrl: z.string().max(400).optional(),
  perks: z.array(z.string()).default([]),
  shippingCost: z.number().min(0).nullable().optional(),
  freeShipping: z.boolean().default(false),
  trialDays: z.number().int().min(0).nullable().optional(),
  firstCycleDiscountPercent: z.number().int().min(0).max(100).nullable().optional(),
  isActive: z.boolean().default(true),
  featured: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
  benefitIds: z.array(z.string()).default([]),
});

export async function savePlan(
  input: z.input<typeof planSchema>,
): Promise<AdminSubscriptionResult> {
  let user;
  try {
    user = await assertPermission("subscriptions.plans");
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Sin permiso." };
  }

  const parsed = planSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Revisá los datos del plan." };
  }
  const data = parsed.data;

  const slug =
    data.slug?.trim() ||
    (await uniqueSlug(data.name, async (candidate) => {
      const existing = await prisma.subscriptionPlan.findUnique({ where: { slug: candidate } });
      return Boolean(existing && existing.id !== data.id);
    }));

  const payload = {
    name: data.name.trim(),
    slug: slugify(slug),
    tagline: data.tagline?.trim() || null,
    description: data.description?.trim() || null,
    price: data.price,
    frequency: data.frequency,
    bottleCount: data.bottleCount,
    imageUrl: data.imageUrl?.trim() || null,
    perks: data.perks.map((p) => p.trim()).filter(Boolean),
    shippingCost: data.shippingCost ?? null,
    freeShipping: data.freeShipping,
    trialDays: data.trialDays ?? null,
    firstCycleDiscountPercent: data.firstCycleDiscountPercent ?? null,
    isActive: data.isActive,
    featured: data.featured,
    sortOrder: data.sortOrder,
  };

  const planId = await prisma.$transaction(async (tx) => {
    const before = data.id
      ? await tx.subscriptionPlan.findUnique({ where: { id: data.id } })
      : null;

    const plan = data.id
      ? await tx.subscriptionPlan.update({ where: { id: data.id }, data: payload })
      : await tx.subscriptionPlan.create({ data: payload });

    await tx.planBenefit.deleteMany({ where: { planId: plan.id } });
    if (data.benefitIds.length) {
      await tx.planBenefit.createMany({
        data: data.benefitIds.map((benefitId) => ({ planId: plan.id, benefitId })),
      });
    }

    await recordAudit(user, {
      action: data.id ? "subscription_plan.update" : "subscription_plan.create",
      entityType: "SubscriptionPlan",
      entityId: plan.id,
      before: before ? { price: toNumber(before.price), name: before.name } : undefined,
      after: { price: data.price, name: data.name },
    });

    return plan.id;
  });

  revalidatePath("/admin/suscripciones/planes");
  revalidatePath("/club");
  return { ok: true, message: data.id ? "Plan actualizado." : "Plan creado.", id: planId };
}

// ══════════════════════════ Box del mes ═════════════════════════════════════

const boxSchema = z.object({
  planId: z.string().min(1),
  periodMonth: z.number().int().min(1).max(12),
  periodYear: z.number().int().min(2020).max(2100),
  name: z.string().max(120).optional(),
  curatorNote: z.string().max(1000).optional(),
  isPublished: z.boolean().default(false),
  items: z
    .array(z.object({ productId: z.string().min(1), quantity: z.number().int().min(1) }))
    .default([]),
});

/**
 * Arma o edita el box de un plan para un período.
 * Editar un box NO altera los pedidos ya generados: cada pedido guarda su
 * propio snapshot (spec §18, §82 caso F).
 */
export async function saveBox(input: z.input<typeof boxSchema>): Promise<AdminSubscriptionResult> {
  let user;
  try {
    user = await assertPermission("subscriptions.box");
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Sin permiso." };
  }

  const parsed = boxSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Revisá los datos del box." };
  }
  const data = parsed.data;

  if (data.items.length === 0) {
    return { ok: false, error: "El box necesita al menos un vino." };
  }

  const products = await prisma.product.findMany({
    where: { id: { in: data.items.map((i) => i.productId) } },
    select: { id: true, price: true, cost: true },
  });

  const estimatedCost = data.items.reduce((acc, item) => {
    const product = products.find((p) => p.id === item.productId);
    return acc + toNumber(product?.cost) * item.quantity;
  }, 0);

  const commercialValue = data.items.reduce((acc, item) => {
    const product = products.find((p) => p.id === item.productId);
    return acc + toNumber(product?.price) * item.quantity;
  }, 0);

  const boxId = await prisma.$transaction(async (tx) => {
    const before = await tx.subscriptionBox.findUnique({
      where: {
        planId_periodYear_periodMonth: {
          planId: data.planId, periodYear: data.periodYear, periodMonth: data.periodMonth,
        },
      },
      include: { items: true },
    });

    const box = await tx.subscriptionBox.upsert({
      where: {
        planId_periodYear_periodMonth: {
          planId: data.planId, periodYear: data.periodYear, periodMonth: data.periodMonth,
        },
      },
      create: {
        planId: data.planId,
        periodMonth: data.periodMonth,
        periodYear: data.periodYear,
        name: data.name?.trim() || null,
        curatorNote: data.curatorNote?.trim() || null,
        isPublished: data.isPublished,
        estimatedCost,
        commercialValue,
      },
      update: {
        name: data.name?.trim() || null,
        curatorNote: data.curatorNote?.trim() || null,
        isPublished: data.isPublished,
        estimatedCost,
        commercialValue,
      },
    });

    await tx.subscriptionBoxItem.deleteMany({ where: { boxId: box.id } });
    await tx.subscriptionBoxItem.createMany({
      data: data.items.map((item) => ({
        boxId: box.id,
        productId: item.productId,
        quantity: item.quantity,
      })),
    });

    await recordAudit(user, {
      action: "subscription_box.update",
      entityType: "SubscriptionBox",
      entityId: box.id,
      before: before
        ? { items: before.items.map((i) => ({ productId: i.productId, quantity: i.quantity })) }
        : undefined,
      after: { items: data.items, isPublished: data.isPublished },
    });

    return box.id;
  });

  revalidatePath("/admin/suscripciones/box");
  revalidatePath("/mi-cuenta/suscripcion");
  return { ok: true, message: "Box guardado.", id: boxId };
}
