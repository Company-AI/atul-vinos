/**
 * Contrato de logística. El sistema nunca habla con una empresa concreta:
 * habla con esta interface. Agregar Andreani, OCA o Correo Argentino es
 * implementarla, no refactorizar el dominio.
 */

export type ShippingDestination = {
  postalCode: string;
  city: string;
  province: string;
  street?: string;
  number?: string;
  apartment?: string;
  reference?: string;
  country?: string;
};

export type ShippingParcel = {
  /** Botellas equivalentes (un pack cuenta por sus componentes). */
  bottles: number;
  weightGrams: number;
  declaredValue: number;
};

export type ShippingQuote = {
  providerCode: string;
  serviceCode: string;
  serviceName: string;
  price: number;
  etaMinDays: number | null;
  etaMaxDays: number | null;
  /** El envío es gratis por una regla comercial (umbral, cupón, plan del Club). */
  free?: boolean;
  freeReason?: string | null;
};

export type CreateShipmentInput = {
  orderId: string;
  orderNumber: number;
  serviceCode: string;
  destination: ShippingDestination;
  recipient: { name: string; phone?: string | null; email?: string | null; documentId?: string | null };
  parcel: ShippingParcel;
};

export type CreateShipmentResult = {
  externalId: string | null;
  trackingNumber: string;
  trackingUrl: string | null;
  cost: number | null;
  labelPayload: Record<string, unknown>;
};

export type TrackingEvent = {
  status: TrackingStatusCode;
  description: string;
  occurredAt: Date;
};

export type TrackingStatusCode =
  | "PENDING" | "LABEL_CREATED" | "DISPATCHED" | "IN_TRANSIT"
  | "OUT_FOR_DELIVERY" | "DELIVERED" | "RETURNED" | "CANCELLED" | "FAILED";

export type TrackingStatus = {
  status: TrackingStatusCode;
  trackingUrl: string | null;
  events: TrackingEvent[];
  deliveredAt: Date | null;
};

/** La etiqueta tal como la emite el correo: un archivo, no datos para dibujar. */
export type CarrierLabel = {
  contentType: string;
  /** Nombre sugerido al descargar. */
  filename: string;
  data: ArrayBuffer;
};

export interface ShippingProvider {
  readonly code: string;
  readonly name: string;
  /** true cuando el proveedor puede operar (credenciales presentes). */
  isConfigured(): boolean;
  quote(destination: ShippingDestination, parcel: ShippingParcel): Promise<ShippingQuote[]>;
  createShipment(input: CreateShipmentInput): Promise<CreateShipmentResult>;
  getTracking(trackingNumber: string): Promise<TrackingStatus>;
  cancelShipment(externalId: string): Promise<void>;
  /**
   * Trae la etiqueta que emitió el correo.
   *
   * Opcional porque la logística propia no tiene una: ahí la etiqueta la
   * dibuja el sistema con los datos del envío. Cuando despacha un correo, en
   * cambio, la etiqueta la emite él —lleva su numeración y su código de
   * ruteo— y lo único que se puede hacer es pedirla e imprimirla.
   */
  getLabel?(externalId: string): Promise<CarrierLabel | null>;
}
