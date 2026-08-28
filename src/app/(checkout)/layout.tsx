import Image from "next/image";
import Link from "next/link";
import { Lock } from "lucide-react";
import { getSettings } from "@/domain/settings/service";
import { Container } from "@/ui/layout";

/** Layout de checkout: sin navegación ni distracciones. */
export default async function CheckoutLayout({ children }: { children: React.ReactNode }) {
  const { company, legal } = await getSettings();

  return (
    <div className="flex min-h-dvh flex-col bg-bone">
      <header className="border-b border-linen-200 bg-bone-pure">
        <Container className="flex h-16 items-center justify-between">
          <Link href="/" aria-label={`${company.name} — inicio`}>
            <Image
              src={company.logoUrl}
              alt={company.name}
              width={170}
              height={34}
              priority
              className="h-8 w-auto"
            />
          </Link>
          <p className="flex items-center gap-2 text-[12px] text-stone-500">
            <Lock className="size-3.5" />
            Compra protegida
          </p>
        </Container>
      </header>

      <main id="contenido" className="flex-1">{children}</main>

      <footer className="border-t border-linen-200 py-6">
        <Container className="flex flex-wrap items-center justify-between gap-3 text-[12px] text-stone-500">
          <p>{legal.minorsNotice}</p>
          <div className="flex gap-4">
            <Link href={legal.termsUrl} className="hover:text-carbon-900">Términos</Link>
            <Link href={legal.privacyUrl} className="hover:text-carbon-900">Privacidad</Link>
            <Link href="/contacto" className="hover:text-carbon-900">Ayuda</Link>
          </div>
        </Container>
      </footer>
    </div>
  );
}
