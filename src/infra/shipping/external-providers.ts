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

/**
 * Andreani.
 *
 * Todavía sin implementar, y a propósito: su documentación está detrás del
 * portal de desarrolladores, que sólo se abre para clientes con contrato. Lo
 * que circula en librerías de la comunidad no coincide entre sí —unas mandan
 * sólo el CP de destino y el contrato, otras agregan peso y medidas, y hay dos
 * versiones de la API dando vueltas—, así que codear contra eso sería inventar
 * una integración que después falla con plata de por medio.
 *
 * Para completarlo hacen falta, de la cuenta de Andreani:
 *   - las credenciales de sandbox y de producción (usuario y clave de la API);
 *   - el número de contrato, que viaja en cada cotización;
 *   - el código de la sucursal de origen desde donde se despacha;
 *   - la documentación del endpoint de tarifas de la versión contratada.
 *
 * Con eso, lo único que hay que escribir es `quote`, `createShipment`,
 * `getTracking` y `cancelShipment` acá adentro, y que `isConfigured` devuelva
 * true cuando las credenciales estén cargadas en Carrier.config. El resto del
 * sistema —la calculadora de la ficha, el checkout, las etiquetas— ya habla
 * contra la interface y no se entera de quién está del otro lado.
 *
 * Mientras tanto el registry cae en el proveedor interno, que cotiza con las
 * zonas y tarifas cargadas en el admin.
 */
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
