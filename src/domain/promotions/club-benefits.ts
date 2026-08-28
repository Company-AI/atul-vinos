import { cache } from "react";
import { prisma } from "@/infra/db/prisma";
import { toNumber } from "@/lib/money";

export type MemberBenefits = {
  isMember: boolean;
  planName: string | null;
  /** Descuento porcentual automático en la tienda. */
  storeDiscountPercent: number;
  freeShipping: boolean;
  earlyAccess: boolean;
  exclusiveWines: boolean;
  codes: string[];
};

const NO_BENEFITS: MemberBenefits = {
  isMember: false, planName: null, storeDiscountPercent: 0,
  freeShipping: false, earlyAccess: false, exclusiveWines: false, codes: [],
};

/**
 * Beneficios vigentes de un socio. Se aplican solos: si el cliente tiene una
 * suscripción activa, el descuento de tienda se calcula sin que tenga que
 * ingresar ningún código.
 */
export const getMemberBenefits = cache(
  async (userId: string | null | undefined): Promise<MemberBenefits> => {
    if (!userId) return NO_BENEFITS;

    const subscription = await prisma.subscription.findFirst({
      where: { userId, status: { in: ["ACTIVE", "PAUSED"] } },
      orderBy: { createdAt: "desc" },
      include: {
        plan: {
          include: { benefits: { include: { benefit: true } } },
        },
      },
    });
    // Solo una suscripción ACTIVE otorga beneficios; PAUSED conserva el historial.
    if (!subscription || subscription.status !== "ACTIVE") return NO_BENEFITS;

    const codes = subscription.plan.benefits
      .filter((pb) => pb.benefit.isActive)
      .map((pb) => pb.benefit.code);

    const storeDiscount = subscription.plan.benefits.find(
      (pb) => pb.benefit.code === "store_discount" && pb.benefit.isActive,
    );

    return {
      isMember: true,
      planName: subscription.plan.name,
      storeDiscountPercent: storeDiscount
        ? toNumber(storeDiscount.overrideValue ?? storeDiscount.benefit.value)
        : 0,
      freeShipping: codes.includes("free_shipping"),
      earlyAccess: codes.includes("early_access"),
      exclusiveWines: codes.includes("exclusive_wines"),
      codes,
    };
  },
);
