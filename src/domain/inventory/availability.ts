import { prisma } from "@/infra/db/prisma";

/**
 * Disponibilidad real.
 *
 *   vino:  available = onHand - reserved
 *   pack:  available = min( floor(available(componente) / cantidad) )
 *
 * Un pack no tiene stock propio: si falta un componente, el pack no se puede
 * armar y por lo tanto no se puede vender.
 */

export type Availability = {
  available: number;
  onHand: number;
  reserved: number;
  minStock: number;
  /** Para packs: qué componente limita la disponibilidad. */
  limitedBy?: { productId: string; name: string; available: number; required: number };
};

export function availableOf(inv: { onHand: number; reserved: number } | null | undefined): number {
  if (!inv) return 0;
  return Math.max(0, inv.onHand - inv.reserved);
}

export async function getAvailabilityMap(
  productIds: string[],
): Promise<Map<string, Availability>> {
  const result = new Map<string, Availability>();
  if (productIds.length === 0) return result;

  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: {
      id: true, kind: true,
      inventory: { select: { onHand: true, reserved: true, minStock: true } },
      packItems: {
        select: {
          quantity: true,
          component: {
            select: {
              id: true, name: true,
              inventory: { select: { onHand: true, reserved: true, minStock: true } },
            },
          },
        },
      },
    },
  });

  for (const product of products) {
    if (product.kind === "WINE") {
      const inv = product.inventory;
      result.set(product.id, {
        available: availableOf(inv),
        onHand: inv?.onHand ?? 0,
        reserved: inv?.reserved ?? 0,
        minStock: inv?.minStock ?? 0,
      });
      continue;
    }

    // Pack: la disponibilidad la define el componente más escaso.
    let packAvailable = Number.POSITIVE_INFINITY;
    let limitedBy: Availability["limitedBy"];

    for (const item of product.packItems) {
      const componentAvailable = availableOf(item.component.inventory);
      const possible = Math.floor(componentAvailable / item.quantity);
      if (possible < packAvailable) {
        packAvailable = possible;
        limitedBy = {
          productId: item.component.id,
          name: item.component.name,
          available: componentAvailable,
          required: item.quantity,
        };
      }
    }

    result.set(product.id, {
      available: product.packItems.length === 0 ? 0 : Math.max(0, packAvailable),
      onHand: 0,
      reserved: 0,
      minStock: 0,
      limitedBy,
    });
  }

  return result;
}

export async function getAvailability(productId: string): Promise<Availability> {
  const map = await getAvailabilityMap([productId]);
  return map.get(productId) ?? { available: 0, onHand: 0, reserved: 0, minStock: 0 };
}

/**
 * Expande un producto a sus unidades de stock reales.
 * Un vino se expande a sí mismo; un pack, a sus componentes.
 */
export async function expandToStockUnits(
  items: { productId: string; quantity: number }[],
): Promise<{ productId: string; quantity: number }[]> {
  if (items.length === 0) return [];

  const products = await prisma.product.findMany({
    where: { id: { in: items.map((i) => i.productId) } },
    select: {
      id: true, kind: true,
      packItems: { select: { componentId: true, quantity: true } },
    },
  });
  const byId = new Map(products.map((p) => [p.id, p]));
  const totals = new Map<string, number>();

  for (const item of items) {
    const product = byId.get(item.productId);
    if (!product) continue;
    if (product.kind === "WINE") {
      totals.set(item.productId, (totals.get(item.productId) ?? 0) + item.quantity);
    } else {
      for (const component of product.packItems) {
        const qty = component.quantity * item.quantity;
        totals.set(component.componentId, (totals.get(component.componentId) ?? 0) + qty);
      }
    }
  }

  return [...totals].map(([productId, quantity]) => ({ productId, quantity }));
}
