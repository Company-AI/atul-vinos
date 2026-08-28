import Image from "next/image";
import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatARS } from "@/lib/money";
import { Badge } from "@/ui/badge";
import { buttonVariants } from "@/ui/button";

export type PlanCardData = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  price: number;
  bottleCount: number;
  frequencyLabel: string;
  perks: string[];
  imageUrl: string | null;
  featured: boolean;
  freeShipping: boolean;
  shippingCost: number;
  firstCycleDiscountPercent: number | null;
};

export function ClubPlanCard({
  plan,
  currentPlanId,
  ctaLabel = "Quiero este plan",
}: {
  plan: PlanCardData;
  currentPlanId?: string | null;
  ctaLabel?: string;
}) {
  const isCurrent = currentPlanId === plan.id;
  const perBottle = plan.bottleCount > 0 ? plan.price / plan.bottleCount : plan.price;

  return (
    <article
      className={cn(
        "on-dark relative flex flex-col overflow-hidden border bg-carbon-800",
        plan.featured ? "border-gold-500/50" : "border-carbon-700",
      )}
    >
      {plan.featured && (
        <div className="absolute right-4 top-4 z-10">
          <Badge tone="gold">El más elegido</Badge>
        </div>
      )}

      {plan.imageUrl && (
        <div className="relative aspect-[16/9] w-full overflow-hidden">
          <Image
            src={plan.imageUrl}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover opacity-70"
          />
          <div aria-hidden className="absolute inset-0 scrim-bottom" />
        </div>
      )}

      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-display text-display-sm font-light text-bone">{plan.name}</h3>
        {plan.tagline && (
          <p className="mt-2 text-[14px] leading-relaxed text-stone-400">{plan.tagline}</p>
        )}

        <div className="mt-6 border-y border-carbon-700 py-5">
          <p className="flex items-baseline gap-1.5">
            <span className="text-2xl font-medium tabular text-bone">{formatARS(plan.price)}</span>
            <span className="text-[13px] text-stone-400">/ mes</span>
          </p>
          <p className="mt-1.5 text-[13px] text-stone-400">
            {plan.bottleCount} botellas · {formatARS(Math.round(perBottle))} por botella
          </p>
          <p className="mt-1 text-[13px] text-stone-400">
            {plan.freeShipping ? "Envío sin cargo" : `Envío ${formatARS(plan.shippingCost)}`}
          </p>
          {plan.firstCycleDiscountPercent ? (
            <p className="mt-2 text-[13px] text-gold-400">
              {plan.firstCycleDiscountPercent}% off en tu primer mes
            </p>
          ) : null}
        </div>

        {plan.perks.length > 0 && (
          <ul className="mt-5 flex-1 space-y-2.5">
            {plan.perks.map((perk) => (
              <li key={perk} className="flex items-start gap-2.5 text-[14px] text-linen-200">
                <Check className="mt-0.5 size-3.5 shrink-0 text-gold-500" />
                {perk}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-7">
          {isCurrent ? (
            <p className="border border-carbon-600 px-4 py-3 text-center text-[12px] uppercase tracking-[0.16em] text-stone-400">
              Tu plan actual
            </p>
          ) : (
            <Link
              href={`/club/suscribirse/${plan.slug}`}
              className={buttonVariants({
                variant: plan.featured ? "primary" : "ghostLight",
                size: "lg",
                block: true,
                uppercase: true,
              })}
            >
              {ctaLabel}
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
