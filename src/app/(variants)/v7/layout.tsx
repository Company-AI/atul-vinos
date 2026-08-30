import type { Metadata } from "next";
import { getSettings } from "@/domain/settings/service";
import { RevealNoFlashScript, RevealObserver } from "@/ui/reveal-observer";
import { VFooter, VHeader, VariantSwitcher } from "@/components/variants/chrome";
import { bodoni } from "../fonts";

export const metadata: Metadata = {
  title: "Nocturno · Dirección de diseño",
  robots: { index: false, follow: false },
};

export default async function NocturnoLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();

  return (
    <div data-variant="nocturno" className={`${bodoni.variable} v-root relative min-h-dvh`}>
      <RevealNoFlashScript />
      <RevealObserver />

      <VHeader companyName={settings.company.name} variant="nocturno" />
      <main>{children}</main>
      <VFooter companyName={settings.company.name} tagline={settings.company.tagline} />
      <VariantSwitcher current="nocturno" />
    </div>
  );
}
