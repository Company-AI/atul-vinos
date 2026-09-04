import type { Metadata } from "next";
import { prisma } from "@/infra/db/prisma";
import { IS_DEMO } from "@/infra/demo/mode";
import { demoShippingZones } from "@/infra/demo/content";
import { getSettings } from "@/domain/settings/service";
import { formatARS, toNumber } from "@/lib/money";
import { Container, Eyebrow, Heading, Prose } from "@/ui/layout";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Envíos",
  description: "Zonas, costos y plazos de entrega. Envío sin cargo a partir del monto configurado.",
  alternates: { canonical: "/envios" },
};

export default async function ShippingInfoPage() {
  const [zones, settings] = await Promise.all([
    IS_DEMO
      ? demoShippingZones()
      : prisma.shippingZone.findMany({
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
          include: { rates: { where: { isActive: true }, orderBy: { sortOrder: "asc" } } },
        }),
    getSettings(),
  ]);

  return (
    <Container size="narrow" className="pb-section pt-4">
      <Eyebrow>Ayuda</Eyebrow>
      <Heading level={1} size="md" className="mt-4">Envíos</Heading>
      <Prose className="mt-5">
        Despachamos a todo el país. El costo exacto se calcula en el checkout según tu código
        postal.
        {settings.shipping.freeShippingFrom
          ? ` A partir de ${formatARS(settings.shipping.freeShippingFrom)} el envío es sin cargo.`
          : ""}
      </Prose>

      <div className="mt-12 space-y-8">
        {zones.map((zone) => (
          <section key={zone.id} className="border-t border-linen-200 pt-6">
            <h2 className="font-display text-display-sm font-light text-carbon-900">{zone.name}</h2>
            {(zone.provinces.length > 0 || zone.cities.length > 0) && (
              <p className="mt-1 text-[13px] text-stone-500">
                {[...zone.cities, ...zone.provinces].join(" · ")}
              </p>
            )}
            <ul className="mt-4 space-y-2">
              {zone.rates.map((rate) => (
                <li key={rate.id} className="flex flex-wrap items-baseline justify-between gap-3 text-[15px]">
                  <span className="text-carbon-800">
                    {rate.name}
                    {rate.etaMinDays !== null && rate.etaMaxDays !== null && (
                      <span className="ml-2 text-[13px] text-stone-500">
                        {rate.etaMinDays === 0
                          ? "disponible en 24 h"
                          : `${rate.etaMinDays} a ${rate.etaMaxDays} días hábiles`}
                      </span>
                    )}
                  </span>
                  <span className="tabular text-carbon-900">
                    {toNumber(rate.price) === 0 ? "Sin cargo" : formatARS(rate.price)}
                    {rate.freeFrom && (
                      <span className="ml-2 text-[13px] text-success-500">
                        gratis desde {formatARS(rate.freeFrom)}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <div className="mt-12 space-y-6 border-t border-linen-200 pt-8">
        <div>
          <h2 className="font-display text-display-sm font-light text-carbon-900">Embalaje</h2>
          <Prose className="mt-3">
            Todas las botellas viajan con separadores de cartón y protección lateral. Si algo llega
            roto, lo reponemos: escribinos dentro de las 48 horas con una foto del embalaje.
          </Prose>
        </div>
        <div>
          <h2 className="font-display text-display-sm font-light text-carbon-900">Entrega</h2>
          <Prose className="mt-3">
            La entrega se hace en el domicilio indicado y requiere una persona mayor de 18 años para
            recibirla. Si no hay nadie, el transportista deja aviso de visita.
          </Prose>
        </div>
      </div>
    </Container>
  );
}
