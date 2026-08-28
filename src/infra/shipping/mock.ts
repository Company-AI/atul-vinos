import type {
  CreateShipmentInput, CreateShipmentResult, ShippingDestination, ShippingParcel,
  ShippingProvider, ShippingQuote, TrackingStatus,
} from "@/domain/shipping/ports";
import { prisma } from "@/infra/db/prisma";
import { toNumber } from "@/lib/money";

/**
 * Proveedor interno funcional: cotiza con las zonas y tarifas configuradas en
 * el admin y genera números de seguimiento propios. Sirve para operar de verdad
 * con logística propia y para desarrollar sin credenciales de terceros.
 */
export class MockShippingProvider implements ShippingProvider {
  readonly code = "mock";
  readonly name = "Logística Aurora (interno)";

  isConfigured(): boolean {
    return true;
  }

  async quote(destination: ShippingDestination, parcel: ShippingParcel): Promise<ShippingQuote[]> {
    const zones = await prisma.shippingZone.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: { rates: { where: { isActive: true }, orderBy: { sortOrder: "asc" } } },
    });

    const matched =
      zones.find((zone) => {
        const cityMatch =
          zone.cities.length > 0 &&
          zone.cities.some((c) => c.toLowerCase() === destination.city.trim().toLowerCase());
        const provinceMatch =
          zone.provinces.length > 0 &&
          zone.provinces.some((p) => p.toLowerCase() === destination.province.trim().toLowerCase());

        if (zone.cities.length > 0 && zone.provinces.length > 0) return cityMatch && provinceMatch;
        if (zone.cities.length > 0) return cityMatch;
        if (zone.provinces.length > 0) return provinceMatch;
        return false;
      }) ??
      // Zona sin provincias ni ciudades = "resto del país"
      zones.find((z) => z.provinces.length === 0 && z.cities.length === 0);

    if (!matched) return [];

    // Recargo por volumen: cada 6 botellas adicionales suma un bulto.
    const extraParcels = Math.max(0, Math.ceil(parcel.bottles / 6) - 1);

    return matched.rates.map((rate) => {
      const base = toNumber(rate.price);
      const price = base === 0 ? 0 : base + extraParcels * Math.round(base * 0.6);
      const freeFrom = rate.freeFrom ? toNumber(rate.freeFrom) : null;
      const free = freeFrom !== null && parcel.declaredValue >= freeFrom;

      return {
        providerCode: this.code,
        serviceCode: rate.id,
        serviceName: rate.name,
        price: free ? 0 : price,
        etaMinDays: rate.etaMinDays,
        etaMaxDays: rate.etaMaxDays,
        free,
        freeReason: free ? `Envío sin cargo en compras desde ${freeFrom}` : null,
      };
    });
  }

  async createShipment(input: CreateShipmentInput): Promise<CreateShipmentResult> {
    const trackingNumber = `AUR${String(input.orderNumber).padStart(6, "0")}`;
    return {
      externalId: null,
      trackingNumber,
      trackingUrl: `/seguimiento/${trackingNumber}`,
      cost: null,
      labelPayload: {
        provider: this.name,
        orderNumber: input.orderNumber,
        recipient: input.recipient,
        destination: input.destination,
        bottles: input.parcel.bottles,
        weightGrams: input.parcel.weightGrams,
      },
    };
  }

  async getTracking(trackingNumber: string): Promise<TrackingStatus> {
    // El estado real lo lleva el admin: se leen los eventos ya registrados.
    const shipment = await prisma.shipment.findFirst({
      where: { trackingNumber },
      include: { events: { orderBy: { occurredAt: "asc" } } },
    });

    if (!shipment) {
      return { status: "PENDING", trackingUrl: null, events: [], deliveredAt: null };
    }

    return {
      status: shipment.status,
      trackingUrl: shipment.trackingUrl,
      deliveredAt: shipment.deliveredAt,
      events: shipment.events.map((e) => ({
        status: e.status,
        description: e.description ?? "",
        occurredAt: e.occurredAt,
      })),
    };
  }

  async cancelShipment(): Promise<void> {
    // Logística propia: la cancelación se resuelve en el admin.
  }
}
