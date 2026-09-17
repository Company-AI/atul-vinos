import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ProductCard } from "@/domain/catalog/types";
import { WineCardRow } from "./wine-card-row";

/**
 * Bloque de un varietal: foto grande al costado y sus vinos al lado, en dos
 * filas de tres.
 *
 * La grilla es de tres columnas y hasta seis productos, así que llena dos
 * filas exactas. Si el varietal tiene menos, renderiza los que hay en lugar
 * de dejar huecos: con tres botellas queda una fila completa, que se lee
 * mejor que dos a medias.
 */
export function VarietalBlock({
  titulo,
  bajada,
  href,
  imagen,
  productos,
  favoritos,
}: {
  titulo: string;
  bajada: string;
  href: string;
  imagen: string;
  productos: ProductCard[];
  favoritos: Set<string>;
}) {
  if (productos.length === 0) return null;

  return (
    <section className="mx-auto max-w-[1600px] px-gutter pt-16">
      <div className="grid gap-7 lg:grid-cols-[360px_minmax(0,1fr)]">
        <Link
          href={href}
          className="group relative hidden min-h-[380px] overflow-hidden rounded-md bg-carbon-900 lg:block"
        >
          <Image
            src={imagen}
            alt=""
            fill
            sizes="360px"
            className="object-cover transition-transform duration-[700ms] ease-out-expo group-hover:scale-[1.04]"
          />
          <span
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-carbon-950/85 via-carbon-950/25 to-transparent"
          />
          <span className="absolute inset-x-7 bottom-8">
            <span className="eyebrow block text-linen-300">Varietal</span>
            <span className="mt-2.5 block font-display text-[30px] font-light leading-tight text-bone">
              {titulo}
            </span>
            <span className="mt-5 inline-flex items-center gap-2 rounded-md bg-bone px-4 py-2 text-[12px] font-medium text-carbon-900">
              Ver todos
              <ArrowRight className="size-3.5" aria-hidden />
            </span>
          </span>
        </Link>

        <div className="min-w-0">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-display-sm font-medium text-carbon-900">{titulo}</h2>
              <p className="mt-1.5 text-[14px] text-stone-600">{bajada}</p>
            </div>
            <Link
              href={href}
              className="inline-flex items-center gap-2 text-[13px] text-accent-700 transition-colors hover:text-accent-600"
            >
              Ver todos
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>

          <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {productos.map((p) => (
              <WineCardRow key={p.id} product={p} isFavorite={favoritos.has(p.id)} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
