import type { Metadata } from "next";
import Image from "next/image";
import { getPageSections } from "@/domain/cms/service";
import { parseBlock } from "@/domain/cms/blocks";
import { prisma } from "@/infra/db/prisma";
import { VContainer, VLabel, VLink, VRule, VSection, VTitle, formatPrice } from "@/components/variants/shared";
import { Reveal, stagger } from "@/ui/reveal";

export const metadata: Metadata = {
  title: "El Club · Casa",
  robots: { index: false, follow: false },
};

export const revalidate = 300;

/**
 * Planes del Club en el lenguaje de Casa. Los planes salen de la base, con sus
 * beneficios reales: si se cambia un precio en el admin, cambia acá también.
 */
export default async function CasaClubPage() {
  const [sections, plans] = await Promise.all([
    getPageSections("club"),
    prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: { benefits: { include: { benefit: true }, orderBy: { benefit: { sortOrder: "asc" } } } },
    }),
  ]);

  const find = (key: string) => sections.find((s) => s.key === key);
  const hero = parseBlock("video_hero", find("club.hero")?.data);
  const steps = parseBlock("steps", find("club.steps")?.data);

  return (
    <>
      <section className="relative flex min-h-[62svh] items-end overflow-hidden pb-16 pt-40">
        <Image
          src={hero.media.imageUrl || "/media/scenes/pouring.jpg"}
          alt=""
          fill
          priority
          sizes="100vw"
          className="-z-10 object-cover"
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{
            background:
              "linear-gradient(to top, rgb(45 34 26 / 0.88) 0%, rgb(45 34 26 / 0.5) 48%, rgb(45 34 26 / 0.14) 100%)",
          }}
        />

        <VContainer size="wide">
          <div className="max-w-2xl" style={{ color: "var(--v-surface)" }}>
            <Reveal>
              <VLabel style={{ color: "color-mix(in srgb, var(--v-surface) 76%, transparent)" }}>
                {hero.eyebrow}
              </VLabel>
            </Reveal>
            <Reveal delay={0.12} variant="line">
              <VTitle level={1} hero className="mt-5">
                {hero.title}
              </VTitle>
            </Reveal>
            <Reveal delay={0.24}>
              <p
                className="mt-6 text-[16px] leading-[1.75]"
                style={{ color: "color-mix(in srgb, var(--v-surface) 82%, transparent)", maxWidth: "54ch" }}
              >
                {hero.subtitle}
              </p>
            </Reveal>
          </div>
        </VContainer>
      </section>

      {steps.steps.length > 0 && (
        <VSection surface="raised">
          <VContainer size="wide">
            <Reveal className="max-w-2xl">
              <VLabel style={{ color: "var(--v-accent)" }}>{steps.eyebrow}</VLabel>
              <VTitle className="mt-4">{steps.title}</VTitle>
            </Reveal>

            <ol className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
              {steps.steps.map((step, i) => (
                <li key={step.title} data-reveal style={stagger(i, 0.08)}>
                  <p className="v-title-type" style={{ color: "var(--v-accent)", fontSize: "calc(var(--v-title) * 0.7)" }}>
                    {String(i + 1).padStart(2, "0")}
                  </p>
                  <VRule className="mt-4" />
                  <h3 className="v-title-type mt-5" style={{ fontSize: "calc(var(--v-title) * 0.5)" }}>
                    {step.title}
                  </h3>
                  <p className="mt-3 text-[14px] leading-[1.7]" style={{ color: "var(--v-muted)" }}>
                    {step.body}
                  </p>
                </li>
              ))}
            </ol>
          </VContainer>
        </VSection>
      )}

      <VSection id="planes">
        <VContainer size="wide">
          <Reveal className="max-w-2xl">
            <VLabel style={{ color: "var(--v-accent)" }}>Los planes</VLabel>
            <VTitle className="mt-4">Elegí cuánto vino querés descubrir.</VTitle>
          </Reveal>

          <div className="mt-14 grid gap-8 lg:grid-cols-3">
            {plans.map((plan, i) => {
              const price = Number(plan.price);
              const perBottle = plan.bottleCount > 0 ? price / plan.bottleCount : price;

              return (
                <article
                  key={plan.id}
                  data-reveal
                  style={{ ...stagger(i, 0.1), backgroundColor: "var(--v-surface)" }}
                  className="flex flex-col p-9"
                >
                  <VLabel style={{ color: "var(--v-muted)" }}>Plan</VLabel>
                  <h3 className="v-title-type mt-2">{plan.name}</h3>
                  <p className="mt-4 text-[14px] leading-[1.7]" style={{ color: "var(--v-muted)" }}>
                    {plan.description}
                  </p>

                  <VRule className="mt-7" />

                  <p className="mt-7">
                    <span className="v-title-type tabular" style={{ color: "var(--v-accent)" }}>
                      {formatPrice(price)}
                    </span>
                    <span className="ml-2 text-[14px]" style={{ color: "var(--v-muted)" }}>
                      / mes
                    </span>
                  </p>
                  <p className="mt-2 text-[13px] tabular" style={{ color: "var(--v-muted)" }}>
                    {plan.bottleCount} botellas · {formatPrice(perBottle)} por botella
                  </p>

                  <ul className="mt-7 flex-1 space-y-3">
                    {plan.benefits.map(({ benefit }) => (
                      <li key={benefit.id} className="flex gap-3 text-[14px]">
                        <span aria-hidden style={{ color: "var(--v-accent)" }}>
                          ·
                        </span>
                        <span>{benefit.name}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-9">
                    <VLink href={`/club/suscribirse/${plan.slug}`} variant="solid" className="w-full">
                      Quiero este plan
                    </VLink>
                  </div>
                </article>
              );
            })}
          </div>
        </VContainer>
      </VSection>
    </>
  );
}
