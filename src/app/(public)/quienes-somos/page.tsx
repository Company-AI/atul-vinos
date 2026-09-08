import type { Metadata } from "next";
import { getPageSections } from "@/domain/cms/service";
import { getSettings } from "@/domain/settings/service";
import { SectionRenderer } from "@/components/marketing/section-renderer";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const { company } = await getSettings();
  return {
    title: "Quiénes somos",
    description: `Cómo elegimos los vinos que vendemos, con qué bodegas trabajamos y por qué el catálogo de ${company.name} es corto a propósito.`,
    alternates: { canonical: "/quienes-somos" },
  };
}

/**
 * Acá vive el material que antes cargaba la home: el criterio de selección,
 * el proceso y las bodegas que representamos. La home quedó para vender, y
 * este contenido —que es bueno pero largo— pasó a una entrada del menú.
 */
export default async function QuienesSomosPage() {
  const [sections, settings] = await Promise.all([
    getPageSections("quienes-somos"),
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
