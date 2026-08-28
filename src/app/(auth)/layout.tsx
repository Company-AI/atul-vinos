import Image from "next/image";
import Link from "next/link";
import { getSettings } from "@/domain/settings/service";
import { Container } from "@/ui/layout";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const { company, legal } = await getSettings();

  return (
    <div className="flex min-h-dvh flex-col bg-bone">
      <header className="border-b border-linen-200 bg-bone-pure">
        <Container className="flex h-16 items-center">
          <Link href="/" aria-label={`${company.name} — inicio`}>
            <Image
              src={company.logoUrl} alt={company.name} width={170} height={34}
              priority className="h-8 w-auto"
            />
          </Link>
        </Container>
      </header>

      <main id="contenido" className="flex flex-1 items-start justify-center px-gutter py-16">
        <div className="w-full max-w-[420px]">{children}</div>
      </main>

      <footer className="py-6 text-center text-[12px] text-stone-500">
        {legal.minorsNotice}
      </footer>
    </div>
  );
}
