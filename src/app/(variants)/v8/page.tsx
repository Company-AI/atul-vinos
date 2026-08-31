import { getPageSections } from "@/domain/cms/service";
import { getSettings } from "@/domain/settings/service";
import { SectionRenderer } from "@/components/marketing/section-renderer";

/**
 * Idéntica a la home de "/": mismo contenido y mismo renderer. La diferencia
 * está sólo en el data-theme del layout.
 */
export default async function OscuroPage() {
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
