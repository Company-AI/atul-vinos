import type {
  CreateShipmentInput, CreateShipmentResult, ShippingDestination, ShippingParcel,
  ShippingProvider, ShippingQuote, TrackingStatus,
} from "@/domain/shipping/ports";
import { prisma } from "@/infra/db/prisma";

/**
 * Adapters de transportistas externos.
 *
 * No inventamos endpoints: cada clase declara el contrato y lanza un error
 * explícito hasta que se implemente contra la documentación oficial y con
 * credenciales reales. Mientras `isConfigured()` devuelva false, el registry
 * usa el proveedor interno y la operación sigue funcionando.
 *
 * Al implementar:
 *   1. Leer la documentación oficial del transportista.
 *   2. Guardar credenciales en Carrier.config (admin) o variables de entorno.
 *   3. Mapear su estado propio a TrackingStatusCode en `mapStatus`.
 */
abstract class ExternalShippingProvider implements ShippingProvider {
  abstract readonly code: string;
  abstract readonly name: string;

  protected async config(): Promise<Record<string, unknown> | null> {
    const carrier = await prisma.carrier.findUnique({ where: { code: this.code } });
    return (carrier?.config as Record<string, unknown> | null) ?? null;
  }

  isConfigured(): boolean {
    return false;
  }

  protected notImplemented(operation: string): never {
    throw new Error(
      `[${this.code}] ${operation} todavía no está implementado. ` +
        `Cargá las credenciales del transportista y completá el adapter ` +
        `siguiendo su documentación oficial.`,
    );
  }

  async quote(_destination: ShippingDestination, _parcel: ShippingParcel): Promise<ShippingQuote[]> {
    this.notImplemented("quote");
  }
  async createShipment(_input: CreateShipmentInput): Promise<CreateShipmentResult> {
    this.notImplemented("createShipment");
  }
  async getTracking(_trackingNumber: string): Promise<TrackingStatus> {
    this.notImplemented("getTracking");
  }
  async cancelShipment(_externalId: string): Promise<void> {
    this.notImplemented("cancelShipment");
  }
}

export class AndreaniProvider extends ExternalShippingProvider {
  readonly code = "andreani";
  readonly name = "Andreani";
}

export class OcaProvider extends ExternalShippingProvider {
  readonly code = "oca";
  readonly name = "OCA";
}

export class CorreoArgentinoProvider extends ExternalShippingProvider {
  readonly code = "correo_argentino";
  readonly name = "Correo Argentino";
}
