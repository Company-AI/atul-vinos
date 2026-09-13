import { prisma } from "@/infra/db/prisma";
import { IS_DEMO } from "@/infra/demo/mode";
import { demoShippingZones } from "@/infra/demo/content";
import { toNumber } from "@/lib/money";

/**
 * Zonas de envío para el selector del cajón.
 *
 * El prototipo tiene un <select> de zona en el carrito. Nuestro carrito no
 * guarda zona —el envío se cotiza en el checkout contra la dirección real—,
 * así que en vez de dejar un control decorativo el selector muestra la tarifa
 * verdadera de cada zona: precio y monto a partir del cual es sin cargo.
 *
 * Se toma la tarifa más barata de cada zona porque es la que el cliente
 * termina viendo como "desde". El costo definitivo sigue saliendo del
 * checkout.
 */
export type ZonaEnvio = {
  id: string;
  nombre: string;
  precio: number;
  gratisDesde: number | null;
};

export async function listarZonasEnvio(): Promise<ZonaEnvio[]> {
  const zonas = IS_DEMO
    ? demoShippingZones()
    : await prisma.shippingZone.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        include: { rates: { where: { isActive: true }, orderBy: { sortOrder: "asc" } } },
      });

  return zonas
    .map((zona) => {
      const tarifas = zona.rates.map((r) => ({
        precio: toNumber(r.price),
        gratisDesde: r.freeFrom === null || r.freeFrom === undefined ? null : toNumber(r.freeFrom),
      }));
      if (tarifas.length === 0) return null;

      const masBarata = tarifas.reduce((a, b) => (b.precio < a.precio ? b : a));
      return {
        id: zona.id,
        nombre: zona.name,
        precio: masBarata.precio,
        gratisDesde: masBarata.gratisDesde,
      };
    })
    .filter((z): z is ZonaEnvio => z !== null);
}
