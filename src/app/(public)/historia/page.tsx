import type { Metadata } from "next";
import { getPageSections } from "@/domain/cms/service";
import { getSettings } from "@/domain/settings/service";
import { SectionRenderer } from "@/components/marketing/section-renderer";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const { company } = await getSettings();
  return {
    title: "Nuestra historia",
    description: `La historia de ${company.name}: la tierra, la familia y la forma de hacer vino.`,
    alternates: { canonical: "/historia" },
  };
}

export default async function HistoriaPage() {
  const [sections, settings] = await Promise.all([
    getPageSections("historia"),
    getSettings(),
  ]);

  return (
    <SectionRenderer
      sections={sections}
      logoUrl={settings.company.logoLightUrl}
      companyName={settings.company.name}
    />
  );
}
