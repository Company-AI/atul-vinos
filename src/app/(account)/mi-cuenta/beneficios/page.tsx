import type { Metadata } from "next";
import Link from "next/link";
import { Check, Sparkles } from "lucide-react";
import { requireUser } from "@/infra/auth/guards";
import { prisma } from "@/infra/db/prisma";
import { getMemberBenefits } from "@/domain/promotions/club-benefits";
import { toNumber } from "@/lib/money";
import { buttonVariants } from "@/ui/button";
import { EmptyState } from "@/ui/empty-state";
import { Eyebrow, Heading } from "@/ui/layout";

export const metadata: Metadata = {
  title: "Beneficios del Club",
  robots: { index: false, follow: false },
};

export default async function BenefitsPage() {
  const user = await requireUser("/mi-cuenta/beneficios");
  const benefits = await getMemberBenefits(user.id);

  const [subscription, allBenefits] = await Promise.all([
    prisma.subscription.findFirst({
      where: { userId: user.id, status: "ACTIVE" },
      include: { plan: { include: { benefits: { include: { benefit: true } } } } },
    }),
    prisma.clubBenefit.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <>
      <Eyebrow>Mi cuenta</Eyebrow>
      <Heading level={1} size="md" className="mt-3 mb-10">Beneficios del Club</Heading>

      {!benefits.isMember || !subscription ? (
        <EmptyState
          icon={<Sparkles className="size-8" />}
          title="Los beneficios son para socios activos"
          description="Suscribite a cualquier plan del Club y los descuentos se aplican solos en cada compra, sin códigos."
          action={
            <Link href="/club" className={buttonVariants({ variant: "dark", uppercase: true })}>
              Conocer el Club
            </Link>
          }
        />
      ) : (
        <>
          <p className="mb-8 max-w-[62ch] text-[15px] leading-relaxed text-stone-600">
            Como socio del <strong className="font-medium text-carbon-900">{subscription.plan.name}</strong>{" "}
            tenés estos beneficios activos. Se aplican automáticamente: no necesitás ingresar ningún
            código en el checkout.
          </p>

          <ul className="divide-y divide-linen-200 border-y border-linen-200">
            {subscription.plan.benefits.map((pb) => {
              const value = toNumber(pb.overrideValue ?? pb.benefit.value);
              return (
                <li key={pb.benefitId} className="flex items-start gap-4 py-5">
                  <Check className="mt-0.5 size-4 shrink-0 text-success-500" />
                  <div>
                    <p className="text-[15px] font-medium text-carbon-900">
                      {pb.benefit.name}
                      {pb.benefit.code === "store_discount" && value > 0 && (
                        <span className="ml-2 text-wine-700">{value}%</span>
                      )}
                    </p>
                    {pb.benefit.description && (
                      <p className="mt-1 text-[14px] leading-relaxed text-stone-600">
                        {pb.benefit.description}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          {allBenefits.length > subscription.plan.benefits.length && (
            <div className="mt-10">
              <h2 className="eyebrow mb-4 text-stone-500">Otros beneficios del Club</h2>
              <ul className="space-y-2">
                {allBenefits
                  .filter((b) => !subscription.plan.benefits.some((pb) => pb.benefitId === b.id))
                  .map((benefit) => (
                    <li key={benefit.id} className="text-[14px] text-stone-500">
                      {benefit.name}
                      {benefit.description ? ` — ${benefit.description}` : ""}
                    </li>
                  ))}
              </ul>
              <Link
                href="/club#planes"
                className="mt-5 inline-block text-[13px] underline underline-offset-4 hover:text-wine-700"
              >
                Ver qué plan los incluye
              </Link>
            </div>
          )}
        </>
      )}
    </>
  );
}
