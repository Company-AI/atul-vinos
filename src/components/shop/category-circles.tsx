import Image from "next/image";
import Link from "next/link";
import { Wine } from "lucide-react";
import { cn } from "@/lib/cn";

export type CategoryCircle = {
  label: string;
  href: string;
  /** 300×300 con fondo claro y objeto centrado. Sin imagen usa el fallback. */
  imageUrl?: string;
};

/**
 * Fila de categorías en círculos.
 *
 * Se recorre en horizontal en pantallas chicas. Cuando una categoría todavía
 * no tiene foto muestra un círculo tintado con la copa: preferible a mezclar
 * fotos de estilos distintos, que es lo que hace ver desprolija una fila así.
 */
export function CategoryCircles({
  items,
  activo,
}: {
  items: CategoryCircle[];
  activo?: string;
}) {
  return (
    <nav aria-label="Categorías" className="border-b border-linen-200 bg-bone">
      <ul className="rail-snap rail-aligned gap-6 py-7 pr-gutter sm:gap-8">
        {items.map((item) => {
          const esActivo = item.label === activo;
          return (
            <li key={item.label} className="w-[76px] shrink-0 sm:w-[86px]">
              <Link href={item.href} className="group flex flex-col items-center gap-2.5 text-center">
                <span
                  className={cn(
                    "relative grid size-[62px] place-items-center overflow-hidden rounded-full border transition-colors sm:size-[68px]",
                    esActivo
                      ? "border-accent-700 bg-accent-700"
                      : "border-linen-200 bg-bone-pure group-hover:border-linen-300",
                  )}
                >
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt=""
                      fill
                      sizes="68px"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <Wine
                      className={cn("size-6", esActivo ? "text-bone-pure" : "text-stone-500")}
                      strokeWidth={1.5}
                      aria-hidden
                    />
                  )}
                </span>

                <span
                  className={cn(
                    "text-[12px] leading-tight",
                    esActivo ? "font-medium text-accent-700" : "text-carbon-800",
                  )}
                >
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
