import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Check } from "lucide-react";
import { getPlanBySlug } from "@/domain/subscriptions/plans";
import { getSettings } from "@/domain/settings/service";
import { getCurrentUser } from "@/infra/auth/session";
import { prisma } from "@/infra/db/prisma";
import { formatARS, toNumber } from "@/lib/money";
import { SubscribeForm } from "@/components/club/subscribe-form";
import { Container, Eyebrow, Heading } from "@/ui/layout";

type PageProps = { params: Promise<{ plan: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { plan: slug } = await params;
  const plan = await getPlanBySlug(slug);
  return {
    title: plan ? `Suscribirme a ${plan.name}` : "Suscripción",
    robots: { index: false, follow: false },
  };
}

export default async function SubscribePage({ params }: PageProps) {
  const { plan: slug } = await params;
  const plan = await getPlanBySlug(slug);
  if (!plan || !plan.isActive) notFound();

  const user = await getCurrentUser();
  if (!user) redirect(`/ingresar?next=${encodeURIComponent(`/club/suscribirse/${slug}`)}`);

  const [settings, existing, address] = await Promise.all([
    getSettings(),
    prisma.subscription.findFirst({
      where: { userId: user.id, status: { in: ["ACTIVE", "PENDING", "PAYMENT_FAILED"] } },
      include: { plan: true },
    }),
    prisma.address.findFirst({
      where: { userId: user.id },
      orderBy: [{ isDefaultShipping: "desc" }, { createdAt: "desc" }],
    }),
  ]);

  const firstAmount = plan.firstCycleDiscountPercent
    ? Math.round(toNumber(plan.price) * (1 - plan.firstCycleDiscountPercent / 100))
    : toNumber(plan.price);

  return (
    <Container className="pb-section pt-4">
      <Eyebrow>Club {settings.company.name}</Eyebrow>
      <Heading level={1} size="md" className="mt-4">
        Suscribirme al {plan.name}
      </Heading>

      {existing && (
        <div className="mt-8 border border-warning-500/30 bg-warning-100 px-5 py-4">
          <p className="text-[14px] text-warning-500">
            Ya tenés una suscripción a {existing.plan.name} en estado{" "}
            {existing.status === "ACTIVE" ? "activa" : existing.status.toLowerCase()}. Para cambiar
            de plan, hacelo desde{" "}
            <Link href="/mi-cuenta/suscripcion" className="underline underline-offset-4">
              Mi suscripción
            </Link>
            .
          </p>
        </div>
      )}

      <div className="mt-12 grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
        <div>
          <SubscribeForm
            planId={plan.id}
            prefill={{
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              phone: user.phone ?? undefined,
              street: address?.street,
              number: address?.number,
              apartment: address?.apartment ?? undefined,
              city: address?.city,
              province: address?.province,
              postalCode: address?.postalCode,
              reference: address?.reference ?? undefined,
            }}
          />
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="border border-linen-200 bg-bone-pure p-6">
            <p className="eyebrow text-stone-500">Tu plan</p>
            <h2 className="mt-3 font-display text-display-sm font-light text-carbon-900">
              {plan.name}
            </h2>
            {plan.tagline && (
              <p className="mt-2 text-[14px] leading-relaxed text-stone-600">{plan.tagline}</p>
            )}

            <dl className="mt-6 space-y-2.5 border-y border-linen-200 py-5 text-[14px]">
              <div className="flex justify-between">
                <dt className="text-stone-500">Botellas por envío</dt>
                <dd className="tabular text-carbon-900">{plan.bottleCount}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-stone-500">Precio mensual</dt>
                <dd className="tabular text-carbon-900">{formatARS(plan.price)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-stone-500">Envío</dt>
                <dd className="tabular text-carbon-900">
                  {plan.freeShipping ? "Sin cargo" : formatARS(plan.shippingCost)}
                </dd>
              </div>
              {plan.firstCycleDiscountPercent ? (
                <div className="flex justify-between">
                  <dt className="text-stone-500">Primer mes</dt>
                  <dd className="tabular text-wine-700">
                    {formatARS(firstAmount)} ({plan.firstCycleDiscountPercent}% off)
                  </dd>
                </div>
              ) : null}
            </dl>

            {plan.perks.length > 0 && (
              <ul className="mt-5 space-y-2.5">
                {plan.perks.map((perk) => (
                  <li key={perk} className="flex items-start gap-2.5 text-[14px] text-carbon-800">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-clay-500" />
                    {perk}
                  </li>
                ))}
              </ul>
            )}

            <p className="mt-6 text-[12px] leading-relaxed text-stone-500">
              {settings.club.allowSkip
                ? `Podés omitir un envío hasta ${settings.club.skipCutoffDays} días antes del cierre del box.`
                : "Podés pausar o cancelar cuando quieras."}
            </p>
          </div>
        </aside>
      </div>
    </Container>
  );
}
