import type { Metadata } from "next";
import { getPageSections } from "@/domain/cms/service";
import { getSettings } from "@/domain/settings/service";
import { getCurrentUser } from "@/infra/auth/session";
import { prisma } from "@/infra/db/prisma";
import { SectionRenderer } from "@/components/marketing/section-renderer";
import { ClubPlansSection } from "@/components/club/club-plans-section";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const { company } = await getSettings();
  return {
    title: `Club ${company.name}`,
    description:
      "Suscribite al Club y recibí todos los meses una selección de vinos elegida por nuestro enólogo, con envío incluido y beneficios en la tienda.",
    alternates: { canonical: "/club" },
  };
}

export default async function ClubPage() {
  const [sections, settings, user] = await Promise.all([
    getPageSections("club"),
    getSettings(),
    getCurrentUser(),
  ]);

  const activeSubscription = user
    ? await prisma.subscription.findFirst({
        where: { userId: user.id, status: { in: ["ACTIVE", "PAUSED", "PAYMENT_FAILED"] } },
        select: { planId: true },
      })
    : null;

  // Los planes se insertan después del bloque de pasos; si no existe, al final.
  const stepsIndex = sections.findIndex((s) => s.type === "steps");
  const before = stepsIndex >= 0 ? sections.slice(0, stepsIndex + 1) : sections;
  const after = stepsIndex >= 0 ? sections.slice(stepsIndex + 1) : [];

  return (
    <>
      <SectionRenderer
        sections={before}
        logoUrl={settings.company.logoLightUrl}
        companyName={settings.company.name}
        anchors={{ "club.steps": "como-funciona" }}
      />

      <ClubPlansSection currentPlanId={activeSubscription?.planId ?? null} />

      <SectionRenderer
        sections={after}
        logoUrl={settings.company.logoLightUrl}
        companyName={settings.company.name}
        anchors={{ "club.faq": "preguntas" }}
      />
    </>
  );
}
