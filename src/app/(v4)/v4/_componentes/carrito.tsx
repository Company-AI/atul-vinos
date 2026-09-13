"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { applyCoupon, removeCartItem, removeCoupon } from "@/app/actions/cart";
import type { CartSummary } from "@/domain/cart/service";
import { formatARS } from "@/lib/money";
import { toast } from "@/ui/toaster";
import type { ZonaEnvio } from "./zonas";

/**
 * Cajón del carrito con el diseño del prototipo: panel de 430px que entra
 * desde la derecha, encabezado con volanta, lista de ítems, y el bloque de
 * resumen con zona de envío, cupón, totales y el botón de checkout.
 *
 * El contenido es el carrito real del servidor, no el del navegador: stock,
 * cupones y precios los valida el backend. Por eso hay dos diferencias de
 * comportamiento con el prototipo, las dos a favor de que los números sean
 * ciertos:
 *
 * - El cupón se valida contra la base. El prototipo lo busca en un JSON y
 *   avisa con alert(); acá el error vuelve del servidor.
 * - El envío que muestra el selector es la tarifa real de esa zona, pero
 *   sigue siendo una estimación: el costo definitivo sale del checkout, que
 *   cotiza contra la dirección concreta.
 */
export function CarritoV4({
  abierto,
  onCerrar,
  zonas,
}: {
  abierto: boolean;
  onCerrar: () => void;
  zonas: ZonaEnvio[];
}) {
  const router = useRouter();
  const [carrito, setCarrito] = useState<CartSummary | null>(null);
  const [cupon, setCupon] = useState("");
  const [zonaId, setZonaId] = useState(zonas[0]?.id ?? "");
  const [pendiente, iniciar] = useTransition();

  const cargar = useCallback(async () => {
    const res = await fetch("/api/cart", { cache: "no-store" });
    if (res.ok) setCarrito((await res.json()).cart);
  }, []);

  useEffect(() => {
    if (abierto) void cargar();
  }, [abierto, cargar]);

  useEffect(() => {
    if (!abierto) return;
    const alTeclear = (e: KeyboardEvent) => e.key === "Escape" && onCerrar();
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [abierto, onCerrar]);

  const mutar = (fn: () => Promise<{ ok: boolean; error?: string; message?: string }>) =>
    iniciar(async () => {
      const r = await fn();
      if (!r.ok) toast.error(r.error ?? "No pudimos actualizar el carrito.");
      else if (r.message) toast.success(r.message);
      await cargar();
      router.refresh();
    });

  const lineas = carrito?.lines ?? [];
  const subtotal = carrito?.pricing.subtotal ?? 0;
  const descuento = carrito?.pricing.discountTotal ?? 0;

  const zona = zonas.find((z) => z.id === zonaId) ?? zonas[0];
  const envioGratis =
    zona?.gratisDesde !== null && zona?.gratisDesde !== undefined
      ? subtotal >= zona.gratisDesde
      : zona?.precio === 0;
  const envio = zona ? (envioGratis ? 0 : zona.precio) : null;
  const total = Math.max(0, subtotal - descuento + (envio ?? 0));

  return (
    <>
      <aside
        className={abierto ? "cart-drawer open" : "cart-drawer"}
        aria-hidden={!abierto}
        // Sin inert el lector de pantalla y el tabulador entran igual al cajón cerrado.
        inert={!abierto}
        aria-label="Carrito"
      >
        <div className="cart-head">
          <div>
            <span className="eyebrow">TU SELECCIÓN</span>
            <h3>Carrito</h3>
          </div>
          <button type="button" className="icon-button" onClick={onCerrar} aria-label="Cerrar">
            ×
          </button>
        </div>

        <div className="cart-items">
          {lineas.length === 0 ? (
            <p style={{ color: "var(--muted)" }}>Tu carrito está vacío.</p>
          ) : (
            lineas.map((linea) => (
              <div className="cart-item" key={linea.itemId}>
                <div>
                  <h4>{linea.name}</h4>
                  <small>
                    {linea.quantity} × {formatARS(linea.unitPrice)}
                  </small>
                  {linea.exceedsStock && (
                    <>
                      <br />
                      <small style={{ color: "var(--burgundy)" }}>
                        Quedan {linea.available}
                      </small>
                    </>
                  )}
                </div>
                <div>
                  <strong>{formatARS(linea.lineTotal)}</strong>
                  <br />
                  <button
                    type="button"
                    className="text-button"
                    disabled={pendiente}
                    onClick={() => mutar(() => removeCartItem(linea.itemId))}
                  >
                    Quitar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="cart-summary">
          <label htmlFor="v4-zona">
            Zona de envío
            <select id="v4-zona" value={zonaId} onChange={(e) => setZonaId(e.target.value)}>
              {zonas.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.nombre}
                  {z.precio === 0 ? " · Gratis" : ""}
                </option>
              ))}
            </select>
          </label>

          <label htmlFor="v4-cupon">
            Cupón
            <div className="coupon-row">
              <input
                id="v4-cupon"
                placeholder="Código"
                value={carrito?.coupon ? carrito.coupon.code : cupon}
                disabled={Boolean(carrito?.coupon) || pendiente}
                onChange={(e) => setCupon(e.target.value)}
              />
              {carrito?.coupon ? (
                <button type="button" disabled={pendiente} onClick={() => mutar(removeCoupon)}>
                  Quitar
                </button>
              ) : (
                <button
                  type="button"
                  disabled={pendiente || cupon.trim().length === 0}
                  onClick={() => mutar(() => applyCoupon(cupon.trim()))}
                >
                  Aplicar
                </button>
              )}
            </div>
          </label>

          <div className="totals">
            <div>
              <span>Subtotal</span>
              <strong>{formatARS(subtotal)}</strong>
            </div>
            {descuento > 0 && (
              <div>
                <span>Descuento</span>
                <strong style={{ color: "var(--burgundy)" }}>−{formatARS(descuento)}</strong>
              </div>
            )}
            <div>
              <span>Envío</span>
              <strong>
                {envio === null ? "A calcular" : envio === 0 ? "Gratis" : formatARS(envio)}
              </strong>
            </div>
            <div>
              <span>Total</span>
              <strong>{formatARS(total)}</strong>
            </div>
          </div>

          <button
            type="button"
            className="button primary full"
            disabled={lineas.length === 0 || pendiente}
            onClick={() => router.push("/checkout")}
          >
            Continuar al checkout
          </button>

          <small>
            El envío es una estimación para la zona elegida; el costo final se calcula en el
            checkout con tu dirección. El pago sólo se considera confirmado cuando el
            proveedor notifica al servidor por webhook.
          </small>
        </div>
      </aside>

      <div
        className={abierto ? "drawer-backdrop open" : "drawer-backdrop"}
        onClick={onCerrar}
        aria-hidden
      />
    </>
  );
}
