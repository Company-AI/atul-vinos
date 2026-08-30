import type { Metadata } from "next";
import Image from "next/image";
import { getPageSections } from "@/domain/cms/service";
import { parseBlock } from "@/domain/cms/blocks";
import { prisma } from "@/infra/db/prisma";
import { BackgroundMedia } from "@/components/marketing/background-media";
import { VContainer, VLabel, VLink, VRule, VSection, VTitle, formatPrice } from "@/components/variants/shared";
import { Reveal, stagger } from "@/ui/reveal";

export const metadata: Metadata = {
  title: "El Club · Casa",
  robots: { index: false, follow: false },
};

export const revalidate = 300;

/**
 * Planes del Club en el lenguaje de Casa.
 *
 * Todo el material visual sale de la base: el video del hero y la foto de
 * beneficios vienen de las secciones del CMS, y cada plan trae su propia
 * imagen. Si se cambia un precio o una foto en el admin, cambia acá.
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
  const benefits = parseBlock("editorial", find("club.benefits")?.data);

  return (
    <>
      {/* Hero con el video del Club, no sólo su poster. */}
      <section className="relative isolate flex min-h-[72svh] items-end overflow-hidden pb-16 pt-40">
        <BackgroundMedia media={hero.media} priority />
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{
            background:
              "linear-gradient(to top, rgb(45 34 26 / 0.9) 0%, rgb(45 34 26 / 0.55) 46%, rgb(45 34 26 / 0.18) 100%)",
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
            <Reveal delay={0.34}>
              <div className="mt-9">
                <VLink href="#planes" variant="solid">
                  Ver los planes
                </VLink>
              </div>
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

            <ol className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
              {steps.steps.map((step, i) => (
                <li key={step.title} data-reveal style={stagger(i, 0.08)}>
                  <p
                    className="v-title-type"
                    style={{ color: "var(--v-accent)", fontSize: "calc(var(--v-title) * 0.7)" }}
                  >
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

      {/* Planes: cada uno con su foto, que ya estaba cargada en la base. */}
      <VSection id="planes">
        <VContainer size="wide">
          <Reveal className="max-w-2xl">
            <VLabel style={{ color: "var(--v-accent)" }}>Los planes</VLabel>
            <VTitle className="mt-4">Elegí cuánto vino querés descubrir.</VTitle>
          </Reveal>

          <div className="mt-12 grid gap-8 lg:grid-cols-3">
            {plans.map((plan, i) => {
              const price = Number(plan.price);
              const perBottle = plan.bottleCount > 0 ? price / plan.bottleCount : price;

              return (
                <article
                  key={plan.id}
                  data-reveal
                  style={{ ...stagger(i, 0.1), backgroundColor: "var(--v-surface)" }}
                  className="flex flex-col overflow-hidden"
                >
                  {plan.imageUrl && (
                    <div className="relative aspect-[16/10] w-full overflow-hidden">
                      <Image
                        src={plan.imageUrl}
                        alt=""
                        fill
                        sizes="(max-width: 1024px) 100vw, 32vw"
                        className="object-cover"
                      />
                      {plan.featured && (
                        <span
                          className="v-label absolute left-0 top-0 px-3 py-1.5"
                          style={{ backgroundColor: "var(--v-accent)", color: "var(--v-on-accent)" }}
                        >
                          El más elegido
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex flex-1 flex-col p-8">
                    <h3 className="v-title-type">{plan.name}</h3>
                    <p className="mt-3 text-[14px] leading-[1.7]" style={{ color: "var(--v-muted)" }}>
                      {plan.description}
                    </p>

                    <VRule className="mt-6" />

                    <p className="mt-6">
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

                    <ul className="mt-6 flex-1 space-y-3">
                      {plan.benefits.map(({ benefit }) => (
                        <li key={benefit.id} className="flex gap-3 text-[14px]">
                          <span aria-hidden style={{ color: "var(--v-accent)" }}>
                            ·
                          </span>
                          <span>{benefit.name}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-8">
                      <VLink href={`/club/suscribirse/${plan.slug}`} variant="solid" className="w-full">
                        Quiero este plan
                      </VLink>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </VContainer>
      </VSection>

      {/* Beneficios: la sección existía en el CMS con su foto y no se mostraba. */}
      {benefits.title && (
        <VSection surface="sunk" className="relative overflow-hidden">
          {benefits.media.imageUrl && (
            <Image
              src={benefits.media.imageUrl}
              alt=""
              aria-hidden
              fill
              sizes="100vw"
              className="object-cover opacity-25"
            />
          )}

          <VContainer size="wide" className="relative">
            <div className="max-w-2xl">
              <Reveal>
                <VLabel style={{ color: "color-mix(in srgb, var(--v-bg) 74%, transparent)" }}>
                  {benefits.eyebrow}
                </VLabel>
                <VTitle className="mt-4">{benefits.title}</VTitle>
              </Reveal>
              <Reveal delay={0.14}>
                <div
                  className="mt-6 text-[15px] leading-[1.8] [&_p+p]:mt-5"
                  style={{ color: "color-mix(in srgb, var(--v-bg) 80%, transparent)" }}
                >
                  {benefits.body.split("\n\n").map((p) => (
                    <p key={p.slice(0, 24)}>{p}</p>
                  ))}
                </div>
              </Reveal>
              {benefits.cta.label && (
                <Reveal delay={0.24}>
                  <div className="mt-9">
                    <VLink href="#planes" variant="solid">
                      {benefits.cta.label}
                    </VLink>
                  </div>
                </Reveal>
              )}
            </div>
          </VContainer>
        </VSection>
      )}
    </>
  );
}
