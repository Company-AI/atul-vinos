import { prisma } from "@/infra/db/prisma";
import { getShippingProvider } from "@/infra/shipping/registry";
import { getSettings } from "@/domain/settings/service";
import { toCents, toNumber } from "@/lib/money";
import type {
  CreateShipmentInput, ShippingDestination, ShippingParcel, ShippingQuote,
} from "./ports";

export type QuoteContext = {
  destination: ShippingDestination;
  bottles: number;
  /** Subtotal neto (después de descuentos), para umbrales de envío gratis. */
  netAmount: number;
  /** El pedido tiene envío cubierto (plan del Club o cupón). */
  shippingCovered?: boolean;
  providerCode?: string | null;
};

export async function buildParcel(bottles: number, declaredValue: number): Promise<ShippingParcel> {
  const { shipping } = await getSettings();
  return {
    bottles,
    weightGrams: bottles * shipping.bottleWeightGrams + shipping.packagingWeightGrams,
    declaredValue,
  };
}

/** Cotiza el envío. Devuelve siempre al menos una opción o una lista vacía explícita. */
export async function quoteShipping(ctx: QuoteContext): Promise<ShippingQuote[]> {
  const [settings, provider] = await Promise.all([
    getSettings(),
    Promise.resolve(getShippingProvider(ctx.providerCode ?? undefined)),
  ]);

  const parcel = await buildParcel(ctx.bottles, ctx.netAmount);
  let quotes = await provider.quote(ctx.destination, parcel);

  // Umbral global de envío gratis, además del que pueda tener cada tarifa.
  const threshold = settings.shipping.freeShippingFrom;
  if (threshold !== null && ctx.netAmount >= threshold) {
    quotes = quotes.map((q) =>
      q.price > 0
        ? { ...q, price: 0, free: true, freeReason: "Envío sin cargo por el monto de tu compra" }
        : q,
    );
  }

  if (ctx.shippingCovered) {
    quotes = quotes.map((q) => ({
      ...q, price: 0, free: true, freeReason: "Envío incluido en tu plan del Club",
    }));
  }

  return quotes.sort((a, b) => a.price - b.price);
}

/** Genera el envío en el proveedor y lo persiste con su etiqueta. */
export async function createShipmentForOrder(orderId: string, serviceCode?: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, shipments: true },
  });
  if (!order) throw new Error("Pedido inexistente.");

  const existing = order.shipments.find((s) => s.status !== "CANCELLED");
  if (existing) return existing;

  const provider = getShippingProvider(order.carrierCode);
  const carrier = await prisma.carrier.findUnique({ where: { code: provider.code } });
  const snapshot = order.shippingSnapshot as Record<string, string>;

  const bottles = order.items.reduce((acc, item) => {
    const packItems = (item.packSnapshot as { quantity: number }[] | null) ?? null;
    const perUnit = packItems
      ? packItems.reduce((s, c) => s + (c.quantity ?? 1), 0)
      : 1;
    return acc + item.quantity * perUnit;
  }, 0);

  const parcel = await buildParcel(bottles, toNumber(order.total));

  const input: CreateShipmentInput = {
    orderId: order.id,
    orderNumber: order.number,
    serviceCode: serviceCode ?? order.shippingMethod ?? "standard",
    destination: {
      postalCode: snapshot.postalCode ?? "",
      city: snapshot.city ?? "",
      province: snapshot.province ?? "",
      street: snapshot.street,
      number: snapshot.number,
      apartment: snapshot.apartment,
      reference: snapshot.reference,
    },
    recipient: {
      name: order.customerName,
      phone: order.customerPhone,
      email: order.customerEmail,
      documentId: order.customerDocument,
    },
    parcel,
  };

  const result = await provider.createShipment(input);
  const { shipping } = await getSettings();

  return prisma.$transaction(async (tx) => {
    const shipment = await tx.shipment.create({
      data: {
        orderId: order.id,
        carrierId: carrier?.id ?? null,
        status: "LABEL_CREATED",
        trackingNumber: result.trackingNumber,
        trackingUrl: result.trackingUrl,
        externalId: result.externalId,
        cost: result.cost ?? toNumber(order.shippingTotal),
        weightGrams: parcel.weightGrams,
      },
    });

    await tx.shippingLabel.create({
      data: {
        shipmentId: shipment.id,
        format: shipping.labelFormatDefault,
        payload: {
          ...result.labelPayload,
          orderNumber: order.number,
          trackingNumber: result.trackingNumber,
          carrier: provider.name,
        },
      },
    });

    await tx.shipmentEvent.create({
      data: {
        shipmentId: shipment.id,
        status: "LABEL_CREATED",
        description: `Etiqueta generada (${provider.name})`,
      },
    });

    await tx.orderEvent.create({
      data: {
        orderId: order.id,
        type: "shipment",
        message: `Envío creado con ${provider.name}. Seguimiento ${result.trackingNumber}.`,
      },
    });

    return shipment;
  });
}

/** Sincroniza el estado del envío contra el proveedor. */
export async function syncShipmentTracking(shipmentId: string) {
  const shipment = await prisma.shipment.findUnique({
    where: { id: shipmentId },
    include: { carrier: true },
  });
  if (!shipment?.trackingNumber) return null;

  const provider = getShippingProvider(shipment.carrier?.code);
  const tracking = await provider.getTracking(shipment.trackingNumber);

  await prisma.shipment.update({
    where: { id: shipment.id },
    data: {
      status: tracking.status,
      trackingUrl: tracking.trackingUrl ?? shipment.trackingUrl,
      deliveredAt: tracking.deliveredAt ?? shipment.deliveredAt,
    },
  });

  return tracking;
}

/** Peso y bultos estimados para el carrito, sin necesidad de pedido. */
export function estimateBottles(
  lines: { quantity: number; kind: string; packComponents: { quantity: number }[] }[],
): number {
  return lines.reduce((acc, line) => {
    const perUnit = line.kind === "PACK"
      ? line.packComponents.reduce((s, c) => s + c.quantity, 0)
      : 1;
    return acc + line.quantity * perUnit;
  }, 0);
}

export { toCents };
