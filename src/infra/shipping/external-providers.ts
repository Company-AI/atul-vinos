import type {
  CreateShipmentInput, CreateShipmentResult, ShippingDestination, ShippingParcel,
  ShippingProvider, ShippingQuote, TrackingStatus,
} from "@/domain/shipping/ports";
import { prisma } from "@/infra/db/prisma";
import { cotizarAndreani, leerConfigAndreani } from "./andreani";
import { cotizarEnviopack, leerConfigEnviopack } from "./enviopack";

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

/**
 * Andreani.
 *
 * El cotizador está implementado contra la documentación oficial; el detalle
 * de la llamada vive en ./andreani.ts. Se activa solo cuando hay credenciales
 * en el entorno, y mientras no las haya el registry cae en el proveedor
 * interno y la tienda cotiza con las zonas del admin.
 */
export class AndreaniProvider extends ExternalShippingProvider {
  readonly code = "andreani";
  readonly name = "Andreani";

  isConfigured(): boolean {
    return leerConfigAndreani() !== null;
  }

  async quote(destination: ShippingDestination, parcel: ShippingParcel): Promise<ShippingQuote[]> {
    const config = leerConfigAndreani();
    if (!config) return [];
    return cotizarAndreani(config, destination, parcel);
  }

  /*
    Crear el envío y seguirlo son otras dos APIs del mismo catálogo, cada una
    con su planilla de campos. Se implementan cuando haya credenciales para
    probarlas: generar una orden de envío de verdad no es algo que convenga
    escribir a ciegas.
  */
}

export class OcaProvider extends ExternalShippingProvider {
  readonly code = "oca";
  readonly name = "OCA";
}

export class CorreoArgentinoProvider extends ExternalShippingProvider {
  readonly code = "correo_argentino";
  readonly name = "Correo Argentino";
}

/**
 * Envíopack.
 *
 * Intermediario: una sola cuenta y devuelve precios de varios correos. No hace
 * falta contrato propio con cada uno, que es lo que lo vuelve el camino corto
 * para una tienda que recién arranca. El detalle de la llamada está en
 * ./enviopack.ts.
 */
export class EnviopackProvider extends ExternalShippingProvider {
  readonly code = "enviopack";
  readonly name = "Envíopack";

  isConfigured(): boolean {
    return leerConfigEnviopack() !== null;
  }

  async quote(destination: ShippingDestination, parcel: ShippingParcel): Promise<ShippingQuote[]> {
    const config = leerConfigEnviopack();
    if (!config) return [];
    return cotizarEnviopack(config, destination, parcel);
  }
}
