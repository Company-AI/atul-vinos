"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ShoppingBag } from "lucide-react";
import { addToCart } from "@/app/actions/cart";
import { Button, type ButtonProps } from "@/ui/button";
import { QuantityStepper } from "@/ui/quantity-stepper";
import { toast } from "@/ui/toaster";

export function AddToCartButton({
  productId,
  available,
  label = "Agregar al carrito",
  outOfStockLabel = "Sin stock",
  quantity = 1,
  withIcon = false,
  onAdded,
  ...buttonProps
}: {
  productId: string;
  available: number;
  label?: string;
  outOfStockLabel?: string;
  quantity?: number;
  withIcon?: boolean;
  onAdded?: () => void;
} & Omit<ButtonProps, "onClick" | "children">) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (available <= 0) {
    return (
      <Button {...buttonProps} disabled>
        {outOfStockLabel}
      </Button>
    );
  }

  return (
    <Button
      {...buttonProps}
      loading={pending}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await addToCart({ productId, quantity });
          if (result.ok) {
            toast.success(result.message ?? "Agregado al carrito.");
            onAdded?.();
            router.refresh();
          } else {
            toast.error(result.error);
          }
        })
      }
    >
      {withIcon && !pending && <ShoppingBag className="size-4" />}
      {label}
    </Button>
  );
}

/** Selector de cantidad + agregar, para la ficha de producto. */
export function AddToCartPanel({
  productId,
  available,
  buyNowHref = "/checkout",
}: {
  productId: string;
  available: number;
  buyNowHref?: string;
}) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [pendingBuy, startBuy] = useTransition();

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <QuantityStepper
          value={quantity}
          onChange={setQuantity}
          max={Math.max(1, available)}
          disabled={available <= 0}
        />
        <AddToCartButton
          productId={productId}
          available={available}
          quantity={quantity}
          variant="primary"
          size="lg"
          uppercase
          withIcon
          className="flex-1 min-w-[200px]"
        />
      </div>

      <Button
        variant="outline"
        size="lg"
        block
        uppercase
        loading={pendingBuy}
        disabled={available <= 0 || pendingBuy}
        onClick={() =>
          startBuy(async () => {
            const result = await addToCart({ productId, quantity });
            if (result.ok) router.push(buyNowHref);
            else toast.error(result.error);
          })
        }
      >
        Comprar ahora
      </Button>
    </div>
  );
}
