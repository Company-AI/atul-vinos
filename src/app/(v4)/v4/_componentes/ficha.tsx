"use client";

import Link from "next/link";
import { useEffect, useRef, useTransition } from "react";
import { addToCart } from "@/app/actions/cart";
import type { ProductCard } from "@/domain/catalog/types";
import { WINE_TYPE_LABELS } from "@/domain/catalog/types";
import { formatARS } from "@/lib/money";
import { toast } from "@/ui/toaster";
import { useRouter } from "next/navigation";

/**
 * Ficha en modal, como en el prototipo: foto a la izquierda, datos a la
 * derecha, con la grilla de dos columnas de atributos.
 *
 * Usa <dialog> nativo igual que el original, así el cierre con Escape y el
 * backdrop vienen de serie.
 *
 * "Por qué la elegimos", "Con qué va" y "Cuándo abrirla" son los tres campos
 * que el prototipo define para la ficha. Acá sólo se muestra el maridaje,
 * porque es el único de los tres que el catálogo tiene cargado: los otros dos
 * no se inventan. La ficha completa vive en /vinos/[slug].
 */
export function FichaV4({
  producto,
  onCerrar,
}: {
  producto: ProductCard | null;
  onCerrar: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();

  useEffect(() => {
    const dialogo = ref.current;
    if (!dialogo) return;
    if (producto && !dialogo.open) dialogo.showModal();
    if (!producto && dialogo.open) dialogo.close();
  }, [producto]);

  if (!producto) return <dialog ref={ref} className="product-dialog" onClose={onCerrar} />;

  const atributos: [string, string][] = [
    ["Tipo", producto.wineType ? WINE_TYPE_LABELS[producto.wineType] : ""],
    ["Varietal", producto.grapes[0] ?? ""],
    ["Región", producto.regionName ?? ""],
    [
      "Stock",
      producto.available > 0 ? `${producto.available} unidades` : "Sin stock",
    ],
  ];

  const agregar = () =>
    iniciar(async () => {
      const resultado = await addToCart({ productId: producto.id, quantity: 1 });
      if (resultado.ok) {
        toast.success(resultado.message ?? "Agregado al carrito.");
        onCerrar();
        router.refresh();
      } else {
        toast.error(resultado.error);
      }
    });

  return (
    <dialog ref={ref} className="product-dialog" onClose={onCerrar}>
      <button type="button" className="dialog-close" onClick={onCerrar} aria-label="Cerrar">
        ×
      </button>

      <div className="product-detail">
        <div className="product-detail-visual">
          {producto.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={producto.imageUrl}
              alt={producto.name}
              style={{ maxWidth: "70%", maxHeight: 420 }}
            />
          ) : (
            <div className="product-placeholder" style={{ transform: "scale(1.35)" }} />
          )}
        </div>

        <div className="product-detail-copy">
          <span className="eyebrow">{producto.wineryName || "SELECCIÓN ATUL"}</span>
          <h2>{producto.name}</h2>
          <div className="price" style={{ fontSize: 22 }}>
            {formatARS(producto.price)}
          </div>

          {producto.shortDescription && <p>{producto.shortDescription}</p>}

          <div className="detail-facts">
            {atributos
              .filter(([, valor]) => valor)
              .map(([etiqueta, valor]) => (
                <div key={etiqueta}>
                  <span>{etiqueta}</span>
                  <strong>{valor}</strong>
                </div>
              ))}
          </div>

          <button
            type="button"
            className="button primary"
            disabled={producto.available <= 0 || pendiente}
            onClick={agregar}
          >
            {producto.available <= 0
              ? "Sin stock"
              : pendiente
                ? "Agregando…"
                : "Agregar al carrito"}
          </button>

          <p style={{ marginTop: 16 }}>
            <Link href={`/vinos/${producto.slug}`} className="inline-link">
              Ver la ficha completa →
            </Link>
          </p>
        </div>
      </div>
    </dialog>
  );
}
