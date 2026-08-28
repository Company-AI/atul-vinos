import type { Prisma, SubscriptionStatus } from "@prisma/client";
import { prisma } from "@/infra/db/prisma";
import { getPaymentProvider } from "@/infra/payments/registry";
import { reserveBoxStockForOrder } from "@/domain/inventory/service";
import { notify } from "@/domain/notifications/service";
import { getSettings } from "@/domain/settings/service";
import { err, ok, type Result } from "@/lib/result";
import { formatARS, toNumber } from "@/lib/money";
import { addMonths, formatDate, periodLabel } from "@/lib/dates";
import { FREQUENCY_MONTHS } from "./status";
import { resolveBoxForPeriod } from "./boxes";

const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// ═══════════════════════════════════ ALTA ═══════════════════════════════════

export type StartSubscriptionInput = {
  userId: string;
  planId: string;
  contact: { firstName: string; lastName: string; email: string; phone: string; documentId?: string | null };
  address: {
    street: string; number: string; apartment?: string | null;
    city: string; province: string; postalCode: string; reference?: string | null;
  };
};

/**
 * Crea el contrato de suscripción y la autorización de débito recurrente.
 * La suscripción queda PENDING hasta que el proveedor confirme el primer cobro
 * por webhook: recién entonces se genera el primer pedido (spec §17).
 */
export async function startSubscription(
  input: StartSubscriptionInput,
): Promise<Result<{ subscriptionId: string; redirectUrl: string | null }>> {
  const plan = await prisma.subscriptionPlan.findUnique({ where: { id: input.planId } });
  if (!plan || !plan.isActive) return err("El plan ya no está disponible.", "PLAN_UNAVAILABLE");

  const existing = await prisma.subscription.findFirst({
    where: { userId: input.userId, status: { in: ["ACTIVE", "PENDING", "PAYMENT_FAILED"] } },
  });
  if (existing) {
    return err(
      "Ya tenés una suscripción en curso. Podés cambiar de plan desde Mi Cuenta.",
      "ALREADY_SUBSCRIBED",
    );
  }

  const settings = await getSettings();
  const frequencyMonths = FREQUENCY_MONTHS[plan.frequency];

  const address = await prisma.address.create({
    data: {
      userId: input.userId,
      label: "Envíos del Club",
      firstName: input.contact.firstName,
      lastName: input.contact.lastName,
      phone: input.contact.phone,
      documentId: input.contact.documentId ?? null,
      street: input.address.street,
      number: input.address.number,
      apartment: input.address.apartment ?? null,
      city: input.address.city,
      province: input.address.province,
      postalCode: input.address.postalCode,
      reference: input.address.reference ?? null,
    },
  });

  const shippingSnapshot = {
    firstName: input.contact.firstName,
    lastName: input.contact.lastName,
    phone: input.contact.phone,
    documentId: input.contact.documentId ?? "",
    street: input.address.street,
    number: input.address.number,
    apartment: input.address.apartment ?? "",
    city: input.address.city,
    province: input.address.province,
    postalCode: input.address.postalCode,
    reference: input.address.reference ?? "",
  };

  // Descuento del primer ciclo, si el plan lo define.
  const firstAmount = plan.firstCycleDiscountPercent
    ? Math.round(toNumber(plan.price) * (1 - plan.firstCycleDiscountPercent / 100))
    : toNumber(plan.price);

  const subscription = await prisma.subscription.create({
    data: {
      userId: input.userId,
      planId: plan.id,
      status: "PENDING",
      amount: toNumber(plan.price),
      currency: settings.company.currency,
      frequency: plan.frequency,
      addressId: address.id,
      shippingSnapshot,
      provider: getPaymentProvider().code,
      events: {
        create: [{ type: "created", message: `Alta solicitada en ${plan.name}` }],
      },
    },
  });

  const provider = getPaymentProvider();
  try {
    const preapproval = await provider.createPreapproval({
      subscriptionId: subscription.id,
      planName: `${settings.company.name} — ${plan.name}`,
      amount: firstAmount,
      currency: settings.company.currency,
      frequencyMonths,
      payerEmail: input.contact.email,
      externalReference: `subscription-${subscription.number}`,
      backUrl: `${siteUrl()}/mi-cuenta/suscripcion`,
      notificationUrl: `${siteUrl()}/api/webhooks/${provider.code}`,
      startDate: plan.trialDays ? addMonths(new Date(), 0) : undefined,
    });

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { externalId: preapproval.externalId, externalStatus: preapproval.status },
    });

    return ok({ subscriptionId: subscription.id, redirectUrl: preapproval.redirectUrl });
  } catch (error) {
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: "CANCELLED", cancelReason: "No se pudo crear la autorización de pago" },
    });
    return err(
      error instanceof Error ? error.message : "No pudimos iniciar la suscripción.",
      "PROVIDER_ERROR",
    );
  }
}

// ═══════════════════════════ COBRO APROBADO ═════════════════════════════════

export type CyclePaymentInput = {
  subscriptionId: string;
  amount: number;
  externalPaymentId: string | null;
  paymentMethod?: string | null;
  rawPayload?: unknown;
  chargedAt?: Date;
};

/**
 * REGLA FUNDAMENTAL (spec §17): cuando el proveedor confirma el cobro mensual,
 * el sistema crea automáticamente el ciclo y el pedido.
 *
 * Una suscripción NUNCA se recrea: se agrega un SubscriptionCycle y un Order.
 * Todo ocurre en una sola transacción y es idempotente por período.
 */
export async function registerCyclePayment(
  input: CyclePaymentInput,
): Promise<Result<{ cycleId: string; orderId: string | null; duplicated: boolean }>> {
  const subscription = await prisma.subscription.findUnique({
    where: { id: input.subscriptionId },
    include: { plan: { include: { benefits: { include: { benefit: true } } } }, user: true },
  });
  if (!subscription) return err("Suscripción inexistente.", "NOT_FOUND");

  const chargedAt = input.chargedAt ?? new Date();
  const periodMonth = chargedAt.getMonth() + 1;
  const periodYear = chargedAt.getFullYear();
  const label = periodLabel(periodMonth, periodYear);

  // Idempotencia: si el ciclo del período ya está pagado, no se duplica el pedido.
  const existingCycle = await prisma.subscriptionCycle.findUnique({
    where: {
      subscriptionId_periodYear_periodMonth: {
        subscriptionId: subscription.id, periodYear, periodMonth,
      },
    },
    include: { order: true },
  });
  if (existingCycle?.status === "PAID" && existingCycle.order) {
    return ok({ cycleId: existingCycle.id, orderId: existingCycle.order.id, duplicated: true });
  }

  const box = await resolveBoxForPeriod(subscription.planId, periodMonth, periodYear);
  const settings = await getSettings();
  const freeShipping = subscription.plan.freeShipping;
  const shippingCost = freeShipping ? 0 : toNumber(subscription.plan.shippingCost);

  const snapshotItems = (box?.items ?? []).map((item) => ({
    productId: item.productId,
    name: item.product.name,
    sku: item.product.sku,
    quantity: item.quantity,
    price: toNumber(item.product.price),
    imageUrl: null as string | null,
  }));

  try {
    const result = await prisma.$transaction(async (tx) => {
      const cycle = existingCycle
        ? await tx.subscriptionCycle.update({
            where: { id: existingCycle.id },
            data: {
              status: "PAID",
              amount: input.amount,
              chargedAt,
              chargeAttempts: { increment: 1 },
              failedAt: null,
              failureReason: null,
              boxId: box?.id ?? existingCycle.boxId,
            },
          })
        : await tx.subscriptionCycle.create({
            data: {
              subscriptionId: subscription.id,
              periodMonth,
              periodYear,
              status: "PAID",
              amount: input.amount,
              chargedAt,
              chargeAttempts: 1,
              boxId: box?.id ?? null,
            },
          });

      await tx.payment.upsert({
        where: {
          idempotencyKey: `sub-${subscription.id}-${periodYear}-${periodMonth}`,
        },
        create: {
          provider: subscription.provider,
          purpose: subscription.cyclesCount === 0 ? "SUBSCRIPTION_SIGNUP" : "SUBSCRIPTION_CYCLE",
          status: "APPROVED",
          amount: input.amount,
          currency: subscription.currency,
          subscriptionId: subscription.id,
          cycleId: cycle.id,
          externalId: input.externalPaymentId,
          externalStatus: "approved",
          externalReference: `subscription-${subscription.number}`,
          idempotencyKey: `sub-${subscription.id}-${periodYear}-${periodMonth}`,
          paymentMethod: input.paymentMethod ?? null,
          approvedAt: chargedAt,
          rawPayload: input.rawPayload ? (input.rawPayload as object) : undefined,
        },
        update: {
          status: "APPROVED",
          externalId: input.externalPaymentId,
          externalStatus: "approved",
          approvedAt: chargedAt,
          cycleId: cycle.id,
        },
      });

      const nextChargeAt = addMonths(chargedAt, FREQUENCY_MONTHS[subscription.frequency]);
      await tx.subscription.update({
        where: { id: subscription.id },
        data: {
          status: "ACTIVE",
          externalStatus: "authorized",
          startedAt: subscription.startedAt ?? chargedAt,
          lastChargeAt: chargedAt,
          nextChargeAt,
          cyclesCount: { increment: existingCycle?.status === "PAID" ? 0 : 1 },
        },
      });

      await tx.subscriptionEvent.create({
        data: {
          subscriptionId: subscription.id,
          type: "payment_approved",
          message: `Cobro aprobado del ciclo ${label}`,
          metadata: { cycleId: cycle.id, amount: input.amount },
        },
      });

      // El ciclo omitido se cobra pero no genera envío.
      if (subscription.skipNextCycle) {
        await tx.subscriptionCycle.update({
          where: { id: cycle.id },
          data: { status: "SKIPPED" },
        });
        await tx.subscription.update({
          where: { id: subscription.id },
          data: { skipNextCycle: false },
        });
        await tx.subscriptionEvent.create({
          data: {
            subscriptionId: subscription.id,
            type: "skipped",
            message: `El envío de ${label} se omitió a pedido del socio`,
          },
        });
        return { cycleId: cycle.id, orderId: null, duplicated: false, missing: [] };
      }

      const snapshot = {
        planId: subscription.plan.id,
        planName: subscription.plan.name,
        planPrice: toNumber(subscription.plan.price),
        chargedAmount: input.amount,
        bottleCount: subscription.plan.bottleCount,
        period: label,
        boxId: box?.id ?? null,
        boxName: box?.name ?? null,
        curatorNote: box?.curatorNote ?? null,
        freeShipping,
        shippingCost,
        benefits: subscription.plan.benefits.map((b) => ({
          code: b.benefit.code,
          name: b.benefit.name,
          value: toNumber(b.overrideValue ?? b.benefit.value),
        })),
        items: snapshotItems.map((i) => ({
          sku: i.sku, name: i.name, quantity: i.quantity, price: i.price,
        })),
      };

      const order = await tx.order.create({
        data: {
          type: "SUBSCRIPTION",
          status: "PAID",
          userId: subscription.userId,
          customerName: `${subscription.user.firstName} ${subscription.user.lastName}`.trim(),
          customerEmail: subscription.user.email,
          customerPhone: subscription.user.phone,
          customerDocument: subscription.user.documentId,
          addressId: subscription.addressId,
          shippingSnapshot: (subscription.shippingSnapshot ?? {}) as Prisma.InputJsonValue,
          subtotal: input.amount,
          shippingTotal: shippingCost,
          total: input.amount + shippingCost,
          currency: subscription.currency,
          subscriptionId: subscription.id,
          cycleId: cycle.id,
          subscriptionSnapshot: snapshot as Prisma.InputJsonValue,
          shippingMethod: freeShipping ? "Envío del Club (sin cargo)" : "Envío del Club",
          carrierCode: settings.shipping.defaultProvider,
          paidAt: chargedAt,
          items: {
            create: snapshotItems.map((item) => ({
              productId: item.productId,
              name: item.name,
              sku: item.sku,
              kind: "WINE",
              unitPrice: item.price,
              quantity: item.quantity,
              lineTotal: item.price * item.quantity,
            })),
          },
          events: {
            create: [
              {
                type: "payment",
                toStatus: "PAID",
                message: `Cobro del Club ${label} aprobado`,
              },
            ],
          },
        },
      });

      const { missing } = await reserveBoxStockForOrder(tx, {
        orderId: order.id,
        boxId: box?.id ?? null,
        period: label,
      });

      // Estado operativo: "A preparar" (spec §17).
      await tx.order.update({
        where: { id: order.id },
        data: { status: "PREPARING" },
      });
      await tx.orderEvent.create({
        data: {
          orderId: order.id,
          type: "status_change",
          fromStatus: "PAID",
          toStatus: "PREPARING",
          message: missing.length
            ? `Pedido generado desde la suscripción. Falta stock: ${missing
                .map((m) => `${m.name} (${m.requested - m.available})`)
                .join(", ")}`
            : "Pedido generado automáticamente desde la suscripción",
        },
      });

      await tx.subscriptionEvent.create({
        data: {
          subscriptionId: subscription.id,
          type: "order_created",
          message: `Pedido #${order.number} generado para ${label}`,
          metadata: { orderId: order.id, orderNumber: order.number },
        },
      });

      return { cycleId: cycle.id, orderId: order.id, duplicated: false, missing };
    });

    if (result.orderId) {
      await notify(
        "subscription.order_created",
        {
          email: subscription.user.email,
          name: `${subscription.user.firstName} ${subscription.user.lastName}`,
          userId: subscription.userId,
        },
        {
          subject: `Tu selección de ${label} está en preparación`,
          heading: `Ya estamos armando tu caja de ${label}`,
          intro: `Cobramos ${formatARS(input.amount)} por tu plan ${subscription.plan.name}. Te avisamos cuando salga de la bodega.`,
          body: `Cobro aprobado del Club ${label}.`,
          items: snapshotItems.map((i) => ({ name: i.name, quantity: i.quantity })),
          cta: { label: "Ver mi suscripción", url: `${siteUrl()}/mi-cuenta/suscripcion` },
        },
        { type: "Subscription", id: subscription.id },
      );
    }

    return ok({ cycleId: result.cycleId, orderId: result.orderId, duplicated: result.duplicated });
  } catch (error) {
    return err(
      error instanceof Error ? error.message : "No pudimos registrar el cobro.",
      "CYCLE_FAILED",
    );
  }
}

// ═══════════════════════════ COBRO RECHAZADO ════════════════════════════════

/**
 * Pago mensual rechazado (spec §21): no se genera pedido, no se despacha nada.
 * Se marca el ciclo, se alerta al cliente y queda visible en el admin.
 */
export async function registerCycleFailure(input: {
  subscriptionId: string;
  amount: number;
  reason?: string | null;
  externalPaymentId?: string | null;
  failedAt?: Date;
  rawPayload?: unknown;
}): Promise<Result<{ cycleId: string }>> {
  const subscription = await prisma.subscription.findUnique({
    where: { id: input.subscriptionId },
    include: { plan: true, user: true },
  });
  if (!subscription) return err("Suscripción inexistente.", "NOT_FOUND");

  const failedAt = input.failedAt ?? new Date();
  const periodMonth = failedAt.getMonth() + 1;
  const periodYear = failedAt.getFullYear();
  const label = periodLabel(periodMonth, periodYear);

  const cycle = await prisma.$transaction(async (tx) => {
    const record = await tx.subscriptionCycle.upsert({
      where: {
        subscriptionId_periodYear_periodMonth: {
          subscriptionId: subscription.id, periodYear, periodMonth,
        },
      },
      create: {
        subscriptionId: subscription.id,
        periodMonth,
        periodYear,
        status: "PAYMENT_FAILED",
        amount: input.amount,
        chargeAttempts: 1,
        failedAt,
        failureReason: input.reason ?? null,
      },
      update: {
        status: "PAYMENT_FAILED",
        chargeAttempts: { increment: 1 },
        failedAt,
        failureReason: input.reason ?? null,
      },
    });

    await tx.payment.upsert({
      where: { idempotencyKey: `sub-fail-${subscription.id}-${periodYear}-${periodMonth}` },
      create: {
        provider: subscription.provider,
        purpose: "SUBSCRIPTION_CYCLE",
        status: "REJECTED",
        amount: input.amount,
        currency: subscription.currency,
        subscriptionId: subscription.id,
        cycleId: record.id,
        externalId: input.externalPaymentId ?? null,
        externalStatus: "rejected",
        failureReason: input.reason ?? null,
        idempotencyKey: `sub-fail-${subscription.id}-${periodYear}-${periodMonth}`,
        rawPayload: input.rawPayload ? (input.rawPayload as object) : undefined,
      },
      update: {
        status: "REJECTED",
        failureReason: input.reason ?? null,
        externalId: input.externalPaymentId ?? undefined,
      },
    });

    await tx.subscription.update({
      where: { id: subscription.id },
      data: { status: "PAYMENT_FAILED", externalStatus: "payment_failed" },
    });

    await tx.subscriptionEvent.create({
      data: {
        subscriptionId: subscription.id,
        type: "payment_failed",
        message: `Cobro rechazado del ciclo ${label}${input.reason ? `: ${input.reason}` : ""}`,
      },
    });

    return record;
  });

  await notify(
    "subscription.payment_failed",
    {
      email: subscription.user.email,
      name: `${subscription.user.firstName} ${subscription.user.lastName}`,
      userId: subscription.userId,
    },
    {
      subject: "No pudimos procesar el pago de tu suscripción",
      heading: "El cobro de tu Club fue rechazado",
      intro: `No pudimos cobrar ${formatARS(input.amount)} de tu plan ${subscription.plan.name}. Tu caja de ${label} queda en espera hasta que se acredite el pago.`,
      body: `Cobro rechazado del Club ${label}.`,
      cta: { label: "Actualizar medio de pago", url: `${siteUrl()}/mi-cuenta/suscripcion` },
      footnote: "Si el problema continúa, escribinos y lo resolvemos juntos.",
    },
    { type: "Subscription", id: subscription.id },
  );

  return ok({ cycleId: cycle.id });
}

// ═════════════════════════════ AUTOGESTIÓN ══════════════════════════════════

const PROVIDER_STATUS_MAP: Record<string, SubscriptionStatus> = {
  pending: "PENDING",
  authorized: "ACTIVE",
  paused: "PAUSED",
  cancelled: "CANCELLED",
  finished: "EXPIRED",
};

/** Sincroniza el estado del contrato con el proveedor (webhook de preapproval). */
export async function syncSubscriptionStatus(externalId: string): Promise<void> {
  const subscription = await prisma.subscription.findFirst({ where: { externalId } });
  if (!subscription) return;

  const provider = getPaymentProvider(subscription.provider);
  const remote = await provider.getPreapproval(externalId);
  if (!remote) return;

  const mapped = PROVIDER_STATUS_MAP[remote.status];
  if (!mapped || mapped === subscription.status) return;

  // Un pago fallido local no se pisa con "authorized" del proveedor.
  if (subscription.status === "PAYMENT_FAILED" && mapped === "ACTIVE") return;

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status: mapped,
      externalStatus: remote.status,
      nextChargeAt: remote.nextPaymentDate ?? subscription.nextChargeAt,
      ...(mapped === "CANCELLED" ? { cancelledAt: new Date() } : {}),
    },
  });

  await prisma.subscriptionEvent.create({
    data: {
      subscriptionId: subscription.id,
      type: "provider_sync",
      message: `El proveedor informó el estado "${remote.status}"`,
    },
  });
}

export async function pauseSubscription(
  subscriptionId: string,
  actorEmail?: string,
): Promise<Result<null>> {
  const settings = await getSettings();
  if (!settings.club.allowPause) return err("La pausa no está habilitada.", "NOT_ALLOWED");

  const subscription = await prisma.subscription.findUnique({ where: { id: subscriptionId } });
  if (!subscription) return err("Suscripción inexistente.", "NOT_FOUND");
  if (subscription.status === "CANCELLED") return err("La suscripción está cancelada.", "CANCELLED");

  try {
    const provider = getPaymentProvider(subscription.provider);
    if (subscription.externalId) {
      await provider.updatePreapprovalStatus(subscription.externalId, "paused");
    }
  } catch (error) {
    console.error("[club] No se pudo pausar en el proveedor:", error);
  }

  await prisma.$transaction([
    prisma.subscription.update({
      where: { id: subscriptionId },
      data: { status: "PAUSED", pausedAt: new Date(), externalStatus: "paused" },
    }),
    prisma.subscriptionEvent.create({
      data: {
        subscriptionId,
        type: "paused",
        message: "Suscripción pausada",
        actorEmail: actorEmail ?? null,
      },
    }),
  ]);

  return ok(null);
}

export async function resumeSubscription(
  subscriptionId: string,
  actorEmail?: string,
): Promise<Result<null>> {
  const subscription = await prisma.subscription.findUnique({ where: { id: subscriptionId } });
  if (!subscription) return err("Suscripción inexistente.", "NOT_FOUND");
  if (subscription.status === "CANCELLED") {
    return err("Una suscripción cancelada no se reactiva: creá una nueva.", "CANCELLED");
  }

  try {
    const provider = getPaymentProvider(subscription.provider);
    if (subscription.externalId) {
      await provider.updatePreapprovalStatus(subscription.externalId, "authorized");
    }
  } catch (error) {
    console.error("[club] No se pudo reactivar en el proveedor:", error);
  }

  await prisma.$transaction([
    prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: "ACTIVE",
        pausedAt: null,
        externalStatus: "authorized",
        nextChargeAt: subscription.nextChargeAt ?? addMonths(new Date(), 1),
      },
    }),
    prisma.subscriptionEvent.create({
      data: {
        subscriptionId,
        type: "resumed",
        message: "Suscripción reactivada",
        actorEmail: actorEmail ?? null,
      },
    }),
  ]);

  return ok(null);
}

export async function cancelSubscription(
  subscriptionId: string,
  reason?: string | null,
  actorEmail?: string,
): Promise<Result<null>> {
  const settings = await getSettings();
  if (!settings.club.allowCancel && !actorEmail) {
    return err("La baja no está habilitada por autogestión.", "NOT_ALLOWED");
  }

  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: { plan: true, user: true },
  });
  if (!subscription) return err("Suscripción inexistente.", "NOT_FOUND");

  try {
    const provider = getPaymentProvider(subscription.provider);
    if (subscription.externalId) {
      await provider.updatePreapprovalStatus(subscription.externalId, "cancelled");
    }
  } catch (error) {
    console.error("[club] No se pudo cancelar en el proveedor:", error);
  }

  // El historial de ciclos y pedidos queda intacto (spec §82 caso E).
  await prisma.$transaction([
    prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancelReason: reason ?? null,
        nextChargeAt: null,
        externalStatus: "cancelled",
      },
    }),
    prisma.subscriptionCycle.updateMany({
      where: { subscriptionId, status: "SCHEDULED" },
      data: { status: "CANCELLED" },
    }),
    prisma.subscriptionEvent.create({
      data: {
        subscriptionId,
        type: "cancelled",
        message: reason ? `Suscripción cancelada: ${reason}` : "Suscripción cancelada",
        actorEmail: actorEmail ?? null,
      },
    }),
  ]);

  await notify(
    "subscription.cancelled",
    {
      email: subscription.user.email,
      name: `${subscription.user.firstName} ${subscription.user.lastName}`,
      userId: subscription.userId,
    },
    {
      subject: "Tu suscripción fue cancelada",
      heading: "Cancelamos tu suscripción",
      intro: `Ya no vamos a hacer más cobros de tu plan ${subscription.plan.name}. Todo tu historial de envíos queda disponible en Mi Cuenta.`,
      body: "Suscripción cancelada.",
      cta: { label: "Volver al Club", url: `${siteUrl()}/club` },
    },
    { type: "Subscription", id: subscription.id },
  );

  return ok(null);
}

export async function changePlan(
  subscriptionId: string,
  newPlanId: string,
  actorEmail?: string,
): Promise<Result<null>> {
  const settings = await getSettings();
  if (!settings.club.allowPlanChange && !actorEmail) {
    return err("El cambio de plan no está habilitado.", "NOT_ALLOWED");
  }

  const [subscription, plan] = await Promise.all([
    prisma.subscription.findUnique({ where: { id: subscriptionId }, include: { plan: true } }),
    prisma.subscriptionPlan.findUnique({ where: { id: newPlanId } }),
  ]);
  if (!subscription) return err("Suscripción inexistente.", "NOT_FOUND");
  if (!plan?.isActive) return err("El plan elegido no está disponible.", "PLAN_UNAVAILABLE");
  if (subscription.planId === newPlanId) return ok(null);

  // El cambio aplica al próximo ciclo: la caja del mes en curso ya está armada.
  await prisma.$transaction([
    prisma.subscription.update({
      where: { id: subscriptionId },
      data: { planId: plan.id, amount: toNumber(plan.price), frequency: plan.frequency },
    }),
    prisma.subscriptionEvent.create({
      data: {
        subscriptionId,
        type: "plan_changed",
        message: `Cambio de plan: ${subscription.plan.name} → ${plan.name} (aplica desde el próximo ciclo)`,
        actorEmail: actorEmail ?? null,
        metadata: { fromPlanId: subscription.planId, toPlanId: plan.id },
      },
    }),
  ]);

  return ok(null);
}

/**
 * Omitir el próximo envío. Solo se permite hasta N días antes del cierre del
 * box, según la configuración del Club.
 */
export async function skipNextCycle(
  subscriptionId: string,
  skip = true,
): Promise<Result<{ skip: boolean }>> {
  const settings = await getSettings();
  if (!settings.club.allowSkip) return err("Omitir envíos no está habilitado.", "NOT_ALLOWED");

  const subscription = await prisma.subscription.findUnique({ where: { id: subscriptionId } });
  if (!subscription) return err("Suscripción inexistente.", "NOT_FOUND");
  if (subscription.status !== "ACTIVE") {
    return err("Solo se puede omitir un envío con la suscripción activa.", "NOT_ACTIVE");
  }

  if (skip) {
    const now = new Date();
    const cutoff = new Date(now.getFullYear(), now.getMonth(), settings.club.boxCutoffDay);
    const limit = new Date(cutoff);
    limit.setDate(limit.getDate() - settings.club.skipCutoffDays);

    if (now > limit && now <= cutoff) {
      return err(
        `Se puede omitir hasta ${settings.club.skipCutoffDays} días antes del cierre ` +
          `(${formatDate(cutoff)}). El próximo envío ya está en preparación.`,
        "CUTOFF_PASSED",
      );
    }
  }

  await prisma.$transaction([
    prisma.subscription.update({ where: { id: subscriptionId }, data: { skipNextCycle: skip } }),
    prisma.subscriptionEvent.create({
      data: {
        subscriptionId,
        type: skip ? "skip_requested" : "skip_cancelled",
        message: skip
          ? "El socio pidió omitir el próximo envío"
          : "Se canceló la omisión del próximo envío",
      },
    }),
  ]);

  return ok({ skip });
}
