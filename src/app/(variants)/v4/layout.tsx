import type { Metadata } from "next";
import { getSettings } from "@/domain/settings/service";
import { RevealNoFlashScript, RevealObserver } from "@/ui/reveal-observer";
import { VFooter, VHeader, VariantSwitcher } from "@/components/variants/chrome";
import { fraunces, jetbrains } from "../fonts";

/*
  Las direcciones de diseño son internas y van noindex: prerenderizarlas no
  aporta nada y obliga a tener base disponible durante el build.
*/
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Terroir · Dirección de diseño",
  robots: { index: false, follow: false },
};

export default async function TerroirLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();

  return (
    <div
      data-variant="terroir"
      className={`${fraunces.variable} ${jetbrains.variable} v-root relative min-h-dvh`}
    >
      <RevealNoFlashScript />
      <RevealObserver />

      <VHeader companyName={settings.company.name} variant="terroir" />
      <main>{children}</main>
      <VFooter companyName={settings.company.name} tagline={settings.company.tagline} />
      <VariantSwitcher current="terroir" />
    </div>
  );
}
