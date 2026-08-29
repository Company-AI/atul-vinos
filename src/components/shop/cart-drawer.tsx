"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { Tag, Trash2, X } from "lucide-react";
import { addToCart, applyCoupon, removeCartItem, removeCoupon, updateCartItem } from "@/app/actions/cart";
import type { CartSummary } from "@/domain/cart/service";
import type { ProductCard } from "@/domain/catalog/types";
import { formatARS } from "@/lib/money";
import { Button, buttonVariants } from "@/ui/button";
import { Drawer } from "@/ui/modal";
import { EmptyState } from "@/ui/empty-state";
import { Input } from "@/ui/field";
import { QuantityStepper } from "@/ui/quantity-stepper";
import { Skeleton } from "@/ui/skeleton";
import { toast } from "@/ui/toaster";

export function CartDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [cart, setCart] = useState<CartSummary | null>(null);
  const [crossSell, setCrossSell] = useState<ProductCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [pending, startTransition] = useTransition();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/cart", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setCart(data.cart);
        setCrossSell(data.crossSell);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (open) load(); }, [open, load]);

  const mutate = (fn: () => Promise<{ ok: boolean; error?: string; message?: string }>) => {
    startTransition(async () => {
      const result = await fn();
      if (!result.ok) toast.error(result.error ?? "No pudimos actualizar el carrito.");
      else if (result.message) toast.success(result.message);
      await load();
      router.refresh();
    });
  };

  const isEmpty = !loading && (!cart || cart.lines.length === 0);

  return (
    <Drawer open={open} onOpenChange={onOpenChange} title="Tu carrito">
      {loading && !cart && (
        <div className="space-y-4 p-5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="size-20 shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-8 w-28" />
              </div>
            </div>
          ))}
        </div>
      )}

      {isEmpty && (
        <div className="p-5">
          <EmptyState
            compact
            title="Tu carrito está vacío"
            description="Todavía no agregaste ningún vino. Empezá por los destacados o mirá los packs."
            action={
              <Link
                href="/vinos"
                onClick={() => onOpenChange(false)}
                className={buttonVariants({ variant: "dark", uppercase: true })}
              >
                Ver los vinos
              </Link>
            }
          />
        </div>
      )}

      {cart && cart.lines.length > 0 && (
        <>
          <ul className="divide-y divide-linen-200">
            {cart.lines.map((line) => (
              <li key={line.itemId} className="flex gap-4 p-5">
                <Link
                  href={`/vinos/${line.slug}`}
                  onClick={() => onOpenChange(false)}
                  className="shrink-0 bg-linen-100"
                >
                  {line.imageUrl && (
                    <Image
                      src={line.imageUrl}
                      alt={line.name}
                      width={72}
                      height={96}
                      className="h-24 w-[72px] object-cover"
                    />
                  )}
                </Link>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/vinos/${line.slug}`}
                        onClick={() => onOpenChange(false)}
                        className="block text-sm font-medium leading-snug text-carbon-900 hover:text-wine-700"
                      >
                        {line.name} {line.vintage ?? ""}
                      </Link>
                      <p className="mt-0.5 text-[12px] text-stone-500">
                        {formatARS(line.unitPrice)} por unidad
                      </p>
                      {line.kind === "PACK" && line.packComponents.length > 0 && (
                        <p className="mt-1 text-[12px] text-stone-500">
                          {line.packComponents.map((c) => `${c.quantity}× ${c.name}`).join(" · ")}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      aria-label={`Quitar ${line.name}`}
                      disabled={pending}
                      onClick={() => mutate(() => removeCartItem(line.itemId))}
                      className="rounded-sm p-1 text-stone-400 transition-colors hover:text-danger-500"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>

                  {line.exceedsStock && (
                    <p role="alert" className="mt-2 text-[12px] text-danger-500">
                      Solo quedan {line.available} disponibles. Ajustá la cantidad para continuar.
                    </p>
                  )}

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <QuantityStepper
                      size="sm"
                      value={line.quantity}
                      max={Math.max(1, line.available)}
                      disabled={pending}
                      onChange={(q) => mutate(() => updateCartItem(line.itemId, q))}
                    />
                    <span className="text-sm font-medium tabular text-carbon-900">
                      {formatARS(line.lineTotal)}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {/* Cross selling discreto, sin presión */}
          {crossSell.length > 0 && (
            <div className="border-t border-linen-200 bg-linen-100 p-5">
              <p className="eyebrow mb-3 text-stone-500">Agregá uno de estos vinos</p>
              <ul className="space-y-3">
                {crossSell.map((p) => (
                  <li key={p.id} className="flex items-center gap-3">
                    {p.imageUrl && (
                      <Image
                        src={p.imageUrl} alt="" width={32} height={43}
                        className="h-11 w-8 shrink-0 object-cover"
                      />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-carbon-900">
                        {p.name} {p.vintage ?? ""}
                      </span>
                      <span className="block text-[12px] tabular text-stone-500">
                        {formatARS(p.price)}
                      </span>
                    </span>
                    <Button
                      size="sm"
                      variant="subtle"
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

          {/* Cupón */}
          <div className="border-t border-linen-200 p-5">
            {cart.coupon ? (
              <div className="flex items-center justify-between gap-3 rounded-sm bg-success-100 px-3 py-2.5">
                <span className="flex items-center gap-2 text-[13px] text-success-500">
                  <Tag className="size-3.5" />
                  Código <strong className="font-medium">{cart.coupon.code}</strong> aplicado
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
                <Button type="submit" variant="subtle" size="md" disabled={pending || !couponCode.trim()}>
                  Aplicar
                </Button>
              </form>
            )}
            {cart.couponError && (
              <p role="alert" className="mt-2 text-[12px] text-danger-500">{cart.couponError}</p>
            )}
          </div>
        </>
      )}

      {cart && cart.lines.length > 0 && (
        <CartFooter cart={cart} onNavigate={() => onOpenChange(false)} />
      )}
    </Drawer>
  );
}

function CartFooter({ cart, onNavigate }: { cart: CartSummary; onNavigate: () => void }) {
  const { pricing } = cart;
  const missing = cart.freeShippingFrom
    ? cart.freeShippingFrom - (pricing.subtotal - pricing.discountTotal)
    : 0;

  return (
    <div className="space-y-3 border-t border-linen-200 bg-bone-pure p-5">
      <dl className="space-y-1.5 text-[13px]">
        <div className="flex justify-between">
          <dt className="text-stone-500">Subtotal</dt>
          <dd className="tabular text-carbon-900">{formatARS(pricing.subtotal)}</dd>
        </div>
        {pricing.memberDiscountCents > 0 && (
          <div className="flex justify-between">
            <dt className="text-stone-500">
              Beneficio socio {cart.member.planName ? `(${cart.member.discountPercent}%)` : ""}
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

      {missing > 0 && (
        <p className="rounded-sm bg-linen-100 px-3 py-2 text-[12px] text-stone-600">
          Te faltan <strong className="font-medium text-carbon-900">{formatARS(missing)}</strong> para
          el envío sin cargo.
        </p>
      )}

      <div className="flex items-baseline justify-between border-t border-linen-200 pt-3">
        <span className="eyebrow text-stone-500">Total</span>
        <span className="text-xl font-medium tabular text-carbon-900">
          {formatARS(pricing.total)}
        </span>
      </div>

      {cart.hasStockIssues ? (
        <Button variant="primary" size="lg" block uppercase disabled>
          Revisá el stock para continuar
        </Button>
      ) : (
        <Link
          href="/checkout"
          onClick={onNavigate}
          className={buttonVariants({ variant: "primary", size: "lg", block: true, uppercase: true })}
        >
          Finalizar compra
        </Link>
      )}

      <Link
        href="/carrito"
        onClick={onNavigate}
        className="block text-center text-[13px] text-stone-500 underline underline-offset-4 hover:text-carbon-900"
      >
        Ver el carrito completo
      </Link>
    </div>
  );
}
