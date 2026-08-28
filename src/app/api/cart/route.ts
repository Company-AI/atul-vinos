import { NextResponse } from "next/server";
import { getCart } from "@/domain/cart/service";
import { getCrossSellProducts } from "@/domain/catalog/service";

/** Estado del carrito para el drawer del header. */
export async function GET() {
  const cart = await getCart();
  const crossSell = await getCrossSellProducts(
    cart.lines.map((l) => l.productId),
    3,
  );

  return NextResponse.json(
    { cart, crossSell },
    { headers: { "Cache-Control": "no-store" } },
  );
}
