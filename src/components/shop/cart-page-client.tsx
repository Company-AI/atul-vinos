"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Tag, Trash2, X } from "lucide-react";
import {
  addToCart, applyCoupon, removeCartItem, removeCoupon, updateCartItem,
} from "@/app/actions/cart";
import type { CartSummary } from "@/domain/cart/service";
import type { ProductCard } from "@/domain/catalog/types";
import { formatARS } from "@/lib/money";
import { Button, buttonVariants } from "@/ui/button";
import { Input } from "@/ui/field";
import { QuantityStepper } from "@/ui/quantity-stepper";
import { toast } from "@/ui/toaster";

export function CartPageClient({
  cart: initialCart,
  crossSell,
}: {
  cart: CartSummary;
  crossSell: ProductCard[];
}) {
  const router = useRouter();
  const [cart, setCart] = useState(initialCart);
  const [couponCode, setCouponCode] = useState("");
  const [pending, startTransition] = useTransition();

  const refresh = async () => {
    const res = await fetch("/api/cart", { cache: "no-store" });
    if (res.ok) setCart((await res.json()).cart);
    router.refresh();
  };

  const mutate = (fn: () => Promise<{ ok: boolean; error?: string; message?: string }>) => {
    startTransition(async () => {
      const result = await fn();
      if (!result.ok) toast.error(result.error ?? "No pudimos actualizar el carrito.");
      else if (result.message) toast.success(result.message);
      await refresh();
    });
  };

  const { pricing } = cart;
  const missingForFreeShipping = cart.freeShippingFrom
    ? cart.freeShippingFrom - (pricing.subtotal - pricing.discountTotal)
    : 0;

  return (
    <div className="grid gap-12 lg:grid-cols-[1.6fr_1fr] lg:gap-16">
      {/* Líneas */}
      <div>
        <ul className="divide-y divide-linen-200 border-y border-linen-200">
          {cart.lines.map((line) => (
            <li key={line.itemId} className="flex gap-5 py-6">
              <Link href={`/vinos/${line.slug}`} className="shrink-0 bg-linen-100">
                {line.imageUrl && (
                  <Image
                    src={line.imageUrl}
                    alt={line.name}
                    width={96}
                    height={128}
                    className="h-32 w-24 object-cover"
                  />
                )}
              </Link>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <Link
                      href={`/vinos/${line.slug}`}
                      className="font-display text-[19px] font-light text-carbon-900 hover:text-wine-700"
                    >
                      {line.name} {line.vintage ?? ""}
                    </Link>
                    <p className="mt-1 text-[13px] text-stone-500">
                      SKU {line.sku} · {formatARS(line.unitPrice)} por unidad
                    </p>
                    {line.kind === "PACK" && line.packComponents.length > 0 && (
                      <ul className="mt-2 space-y-0.5 text-[13px] text-stone-500">
                        {line.packComponents.map((c) => (
                          <li key={c.name}>{c.quantity}× {c.name}</li>
                        ))}
                      </ul>
                    )}
                    {line.exceedsStock && (
                      <p role="alert" className="mt-2 text-[13px] text-danger-500">
                        Solo quedan {line.available} disponibles. Ajustá la cantidad para continuar.
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    aria-label={`Quitar ${line.name}`}
                    disabled={pending}
                    onClick={() => mutate(() => removeCartItem(line.itemId))}
                    className="rounded-sm p-1.5 text-stone-400 transition-colors hover:text-danger-500"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                  <QuantityStepper
                    value={line.quantity}
                    max={Math.max(1, line.available)}
                    disabled={pending}
                    onChange={(q) => mutate(() => updateCartItem(line.itemId, q))}
                  />
                  <span className="text-[15px] font-medium tabular text-carbon-900">
                    {formatARS(line.lineTotal)}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {crossSell.length > 0 && (
          <div className="mt-12">
            <p className="eyebrow mb-4 text-stone-500">Agregá uno de estos vinos a tu pedido</p>
            <ul className="grid gap-4 sm:grid-cols-3">
              {crossSell.map((p) => (
                <li key={p.id} className="border border-linen-200 bg-bone-pure p-4">
                  <div className="flex items-start gap-3">
                    {p.imageUrl && (
                      <Image
                        src={p.imageUrl} alt="" width={48} height={64}
                        className="h-16 w-12 shrink-0 object-cover"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-carbon-900">{p.name}</p>
                      <p className="text-[13px] tabular text-stone-500">{formatARS(p.price)}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="subtle"
                    block
                    className="mt-3"
                    disabled={pending}
                    onClick={() => mutate(() => addToCart({ productId: p.id, quantity: 1 }))}
                  >
                    Agregar
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Resumen */}
      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="border border-linen-200 bg-bone-pure p-6">
          <h2 className="font-display text-display-sm font-light text-carbon-900">Resumen</h2>

          <dl className="mt-6 space-y-2.5 text-[14px]">
            <div className="flex justify-between">
              <dt className="text-stone-500">Subtotal</dt>
              <dd className="tabular text-carbon-900">{formatARS(pricing.subtotal)}</dd>
            </div>

            {pricing.memberDiscountCents > 0 && (
              <div className="flex justify-between">
                <dt className="text-stone-500">
                  Beneficio socio {cart.member.discountPercent}%
                </dt>
                <dd className="tabular text-success-500">
                  −{formatARS(pricing.memberDiscountCents / 100)}
                </dd>
              </div>
            )}

            {pricing.couponDiscountCents > 0 && (
              <div className="flex justify-between">
                <dt className="text-stone-500">Código {cart.coupon?.code}</dt>
                <dd className="tabular text-success-500">
                  −{formatARS(pricing.couponDiscountCents / 100)}
                </dd>
              </div>
            )}

            <div className="flex justify-between">
              <dt className="text-stone-500">Envío</dt>
              <dd className="tabular text-stone-500">
                {pricing.shippingFree ? "Sin cargo" : "Se calcula en el checkout"}
              </dd>
            </div>
          </dl>

          {missingForFreeShipping > 0 && (
            <p className="mt-4 bg-linen-100 px-3 py-2.5 text-[13px] leading-relaxed text-stone-600">
              Te faltan{" "}
              <strong className="font-medium text-carbon-900">
                {formatARS(missingForFreeShipping)}
              </strong>{" "}
              para el envío sin cargo.
            </p>
          )}

          <div className="mt-5 flex items-baseline justify-between border-t border-linen-200 pt-4">
            <span className="eyebrow text-stone-500">Total</span>
            <span className="text-2xl font-medium tabular text-carbon-900">
              {formatARS(pricing.total)}
            </span>
          </div>

          {/* Cupón */}
          <div className="mt-6">
            {cart.coupon ? (
              <div className="flex items-center justify-between gap-3 rounded-sm bg-success-100 px-3 py-2.5">
                <span className="flex items-center gap-2 text-[13px] text-success-500">
                  <Tag className="size-3.5" />
                  <strong className="font-medium">{cart.coupon.code}</strong> aplicado
                </span>
                <button
                  type="button"
                  aria-label="Quitar código"
                  disabled={pending}
                  onClick={() => mutate(() => removeCoupon())}
                  className="rounded-sm p-1 text-success-500 hover:opacity-70"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (couponCode.trim()) mutate(() => applyCoupon(couponCode));
                }}
                className="flex gap-2"
              >
                <Input
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Código de descuento"
                  aria-label="Código de descuento"
                  className="h-10"
                />
                <Button type="submit" variant="subtle" disabled={pending || !couponCode.trim()}>
                  Aplicar
                </Button>
              </form>
            )}
            {cart.couponError && (
              <p role="alert" className="mt-2 text-[13px] text-danger-500">{cart.couponError}</p>
            )}
          </div>

          {cart.member.isMember && (
            <p className="mt-4 text-[12px] leading-relaxed text-stone-500">
              Tu beneficio de socio del {cart.member.planName} ya está aplicado.
            </p>
          )}

          <div className="mt-6">
            {cart.hasStockIssues ? (
              <Button variant="primary" size="lg" block uppercase disabled>
                Revisá el stock para continuar
              </Button>
            ) : (
              <Link
                href="/checkout"
                className={buttonVariants({
                  variant: "primary", size: "lg", block: true, uppercase: true,
                })}
              >
                Finalizar compra
              </Link>
            )}
          </div>

          <Link
            href="/vinos"
            className="mt-4 block text-center text-[13px] text-stone-500 underline underline-offset-4 hover:text-carbon-900"
          >
            Seguir viendo vinos
          </Link>
        </div>
      </aside>
    </div>
  );
}
