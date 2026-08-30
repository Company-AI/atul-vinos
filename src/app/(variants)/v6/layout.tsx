import type { Metadata } from "next";
import { getSettings } from "@/domain/settings/service";
import { RevealNoFlashScript, RevealObserver } from "@/ui/reveal-observer";
import { VFooter, VHeader, VariantSwitcher } from "@/components/variants/chrome";
import { alegreya, alegreyaSC, alegreyaSans } from "../fonts";

export const metadata: Metadata = {
  title: "Casa · Dirección de diseño",
  robots: { index: false, follow: false },
};

export default async function CasaLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();

  return (
    <div
      data-variant="casa"
      className={`${alegreya.variable} ${alegreyaSans.variable} ${alegreyaSC.variable} v-root relative min-h-dvh`}
    >
      <RevealNoFlashScript />
      <RevealObserver />

      <VHeader companyName={settings.company.name} variant="casa" />
      <main>{children}</main>
      <VFooter companyName={settings.company.name} tagline={settings.company.tagline} />
      <VariantSwitcher current="casa" />
    </div>
  );
}
