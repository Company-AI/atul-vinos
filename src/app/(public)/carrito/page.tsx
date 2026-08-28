import type { Metadata } from "next";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { getCart } from "@/domain/cart/service";
import { getCrossSellProducts } from "@/domain/catalog/service";
import { CartPageClient } from "@/components/shop/cart-page-client";
import { buttonVariants } from "@/ui/button";
import { EmptyState } from "@/ui/empty-state";
import { Container, Eyebrow, Heading } from "@/ui/layout";

export const metadata: Metadata = {
  title: "Tu carrito",
  robots: { index: false, follow: false },
};

export default async function CartPage() {
  const cart = await getCart();
  const crossSell = await getCrossSellProducts(cart.lines.map((l) => l.productId), 3);

  return (
    <Container className="pb-section pt-4">
      <Eyebrow>Tu compra</Eyebrow>
      <Heading level={1} size="md" className="mt-4">
        {cart.lines.length === 0
          ? "Tu carrito está vacío"
          : `Tu carrito · ${cart.bottleCount} ${cart.bottleCount === 1 ? "botella" : "botellas"}`}
      </Heading>

      <div className="mt-12">
        {cart.lines.length === 0 ? (
          <EmptyState
            icon={<ShoppingBag className="size-8" />}
            title="Todavía no agregaste ningún vino"
            description="Cuando encuentres algo que te guste, va a aparecer acá. Podés empezar por los destacados o mirar los packs."
            action={
              <div className="flex flex-wrap justify-center gap-3">
                <Link href="/vinos" className={buttonVariants({ variant: "dark", uppercase: true })}>
                  Ver los vinos
                </Link>
                <Link href="/packs" className={buttonVariants({ variant: "outline", uppercase: true })}>
                  Ver los packs
                </Link>
              </div>
            }
          />
        ) : (
          <CartPageClient cart={cart} crossSell={crossSell} />
        )}
      </div>
    </Container>
  );
}
