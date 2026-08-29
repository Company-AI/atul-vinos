import type { Metadata } from "next";
import { getSettings } from "@/domain/settings/service";
import { RevealNoFlashScript, RevealObserver } from "@/ui/reveal-observer";
import { VFooter, VHeader, VariantSwitcher } from "@/components/variants/chrome";
import { jost } from "../fonts";

export const metadata: Metadata = {
  title: "Maison · Dirección de diseño",
  robots: { index: false, follow: false },
};

export default async function MaisonLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();

  return (
    <div data-variant="maison" className={`${jost.variable} v-root relative min-h-dvh`}>
      <RevealNoFlashScript />
      <RevealObserver />

      <VHeader companyName={settings.company.name} variant="maison" />
      <main>{children}</main>
      <VFooter companyName={settings.company.name} tagline={settings.company.tagline} />
      <VariantSwitcher current="maison" />
    </div>
  );
}
