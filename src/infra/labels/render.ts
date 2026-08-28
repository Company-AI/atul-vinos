import "server-only";
import { toSVG } from "bwip-js/node";
import QRCode from "qrcode";
import { prisma } from "@/infra/db/prisma";
import { getSettings } from "@/domain/settings/service";

export type LabelData = {
  shipmentId: string;
  orderId: string;
  orderNumber: number;
  orderType: "STORE" | "SUBSCRIPTION";
  createdAt: Date;
  recipient: {
    name: string;
    phone: string | null;
    documentId: string | null;
    street: string;
    number: string;
    apartment: string;
    city: string;
    province: string;
    postalCode: string;
    reference: string;
  };
  sender: {
    name: string;
    addressLine: string;
    city: string;
    province: string;
    postalCode: string;
    phone: string;
  };
  carrierName: string;
  trackingNumber: string;
  bottles: number;
  weightGrams: number;
  /** SVG inline, sin dependencias externas ni pedidos de red al imprimir. */
  qrSvg: string;
  barcodeSvg: string;
};

/** Code128 en SVG: legible por cualquier lector de depósito. */
function barcode(value: string): string {
  try {
    return toSVG({ bcid: "code128", text: value, scale: 2, height: 12, includetext: false });
  } catch {
    return "";
  }
}

export async function buildLabelData(shipmentIds: string[]): Promise<LabelData[]> {
  if (shipmentIds.length === 0) return [];

  const [shipments, settings] = await Promise.all([
    prisma.shipment.findMany({
      where: { id: { in: shipmentIds } },
      include: {
        carrier: true,
        order: { include: { items: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    getSettings(),
  ]);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  return Promise.all(
    shipments.map(async (shipment) => {
      const address = shipment.order.shippingSnapshot as Record<string, string>;
      const tracking = shipment.trackingNumber ?? `PED-${shipment.order.number}`;

      const bottles = shipment.order.items.reduce((acc, item) => {
        const pack = item.packSnapshot as { quantity: number }[] | null;
        const perUnit = pack ? pack.reduce((s, c) => s + (c.quantity ?? 1), 0) : 1;
        return acc + item.quantity * perUnit;
      }, 0);

      const qrSvg = await QRCode.toString(
        shipment.trackingUrl?.startsWith("http")
          ? shipment.trackingUrl
          : `${siteUrl}${shipment.trackingUrl ?? `/seguimiento/${tracking}`}`,
        { type: "svg", margin: 0, width: 96, errorCorrectionLevel: "M" },
      );
      const barcodeSvg = barcode(tracking);

      return {
        shipmentId: shipment.id,
        orderId: shipment.orderId,
        orderNumber: shipment.order.number,
        orderType: shipment.order.type,
        createdAt: shipment.order.createdAt,
        recipient: {
          name: shipment.order.customerName,
          phone: shipment.order.customerPhone,
          documentId: shipment.order.customerDocument,
          street: address.street ?? "",
          number: address.number ?? "",
          apartment: address.apartment ?? "",
          city: address.city ?? "",
          province: address.province ?? "",
          postalCode: address.postalCode ?? "",
          reference: address.reference ?? "",
        },
        sender: {
          name: settings.company.legalName,
          addressLine: settings.company.addressLine,
          city: settings.company.city,
          province: settings.company.province,
          postalCode: settings.company.postalCode,
          phone: settings.company.phone,
        },
        carrierName: shipment.carrier?.name ?? "Logística propia",
        trackingNumber: tracking,
        bottles,
        weightGrams: shipment.weightGrams ?? bottles * settings.shipping.bottleWeightGrams,
        qrSvg,
        barcodeSvg,
      };
    }),
  );
}

/** Registra la impresión para saber cuántas veces se reimprimió una etiqueta. */
export async function markLabelsPrinted(shipmentIds: string[]): Promise<void> {
  if (shipmentIds.length === 0) return;
  await prisma.shippingLabel.updateMany({
    where: { shipmentId: { in: shipmentIds } },
    data: { printCount: { increment: 1 }, lastPrintedAt: new Date() },
  });
}
