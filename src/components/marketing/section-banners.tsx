import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export type SectionBanner = {
  titulo: string;
  bajada: string;
  cta: string;
  href: string;
  /** 800×350, luz cálida y oscura. Sin imagen queda el fondo del tema. */
  imageUrl?: string;
};

/**
 * Las tres tiras que reemplazan al texto largo de la home anterior.
 *
 * Cada una es una puerta: Box, Novedades y Ofertas. El texto va sobre un velo
 * para que se lea sin depender de qué tan clara sea la foto.
 */
export function SectionBanners({ items }: { items: SectionBanner[] }) {
  if (items.length === 0) return null;

  return (
    <div className="mx-auto grid max-w-[1600px] gap-4 px-gutter py-4 lg:grid-cols-3">
      {items.map((item) => (
        <Link
          key={item.titulo}
          href={item.href}
          className="group relative flex min-h-[172px] items-center overflow-hidden rounded-md bg-carbon-900"
        >
          {item.imageUrl && (
            <Image
              src={item.imageUrl}
              alt=""
              fill
              sizes="(max-width: 1024px) 100vw, 33vw"
              className="object-cover opacity-70 transition-transform duration-[900ms] ease-out-expo group-hover:scale-[1.04]"
            />
          )}
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to right, rgb(13 11 10 / 0.82) 0%, rgb(13 11 10 / 0.55) 55%, rgb(13 11 10 / 0.3) 100%)",
            }}
          />

          <div className="relative px-7 py-6">
            <p className="font-display text-[26px] font-light uppercase leading-none tracking-[0.02em] text-bone">
              {item.titulo}
            </p>
            <p className="mt-2 font-display text-[17px] italic leading-snug text-linen-200">
              {item.bajada}
            </p>
            <span className="mt-5 inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-bone">
              {item.cta}
              <ArrowRight
                className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5"
                aria-hidden
              />
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
