import Link from "next/link";
import { buttonVariants } from "@/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-bone px-6 text-center">
      <p className="eyebrow text-stone-500">Error 404</p>
      <h1 className="mt-5 max-w-[18ch] font-display text-display-lg font-light text-carbon-900">
        No encontramos esta página.
      </h1>
      <p className="mt-5 max-w-[52ch] text-[15px] leading-relaxed text-stone-600">
        Puede que el enlace esté viejo o que el vino que buscabas ya no esté disponible.
      </p>
      <div className="mt-9 flex flex-wrap justify-center gap-3">
        <Link href="/vinos" className={buttonVariants({ variant: "dark", uppercase: true })}>
          Ver los vinos
        </Link>
        <Link href="/" className={buttonVariants({ variant: "outline", uppercase: true })}>
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
