import type { Metadata } from "next";
import { getPageSections } from "@/domain/cms/service";
import { getSettings } from "@/domain/settings/service";
import { SectionRenderer } from "@/components/marketing/section-renderer";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const { seo } = await getSettings();
  return {
    title: { absolute: seo.defaultTitle },
    description: seo.defaultDescription,
    alternates: { canonical: "/" },
  };
}

export default async function HomePage() {
  const [sections, settings] = await Promise.all([
    getPageSections("home"),
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
