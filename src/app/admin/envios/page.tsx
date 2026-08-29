import type { Metadata } from "next";
import Link from "next/link";
import { Printer } from "lucide-react";
import { requireStaff } from "@/infra/auth/guards";
import { prisma } from "@/infra/db/prisma";
import { listShippingProviders } from "@/infra/shipping/registry";
import { toNumber } from "@/lib/money";
import { formatDate } from "@/lib/dates";
import { AdminCard, AdminPageHeader, AdminTable, Td } from "@/components/admin/admin-ui";
import {
  ShippingManager, type CarrierRow, type ZoneRow,
} from "@/components/admin/shipping-manager";
import { Badge } from "@/ui/badge";
import { buttonVariants } from "@/ui/button";

export const metadata: Metadata = { title: "Envíos y etiquetas" };

type PageProps = { searchParams: Promise<{ pendientes?: string }> };

export default async function AdminShippingPage({ searchParams }: PageProps) {
  const staff = await requireStaff("orders.labels");
  const { pendientes } = await searchParams;

  const [zones, carriers, shipments] = await Promise.all([
    prisma.shippingZone.findMany({
      orderBy: { sortOrder: "asc" },
      include: { rates: { orderBy: { sortOrder: "asc" }, include: { carrier: true } } },
    }),
    prisma.carrier.findMany({
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { shipments: true } } },
    }),
    prisma.shipment.findMany({
      where: pendientes ? { status: { in: ["PENDING", "LABEL_CREATED"] } } : {},
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        carrier: true,
        order: { select: { id: true, number: true, customerName: true, status: true } },
        labels: { select: { printCount: true, format: true } },
      },
    }),
  ]);

  const providers = listShippingProviders();

  const zoneRows: ZoneRow[] = zones.map((zone) => ({
    id: zone.id,
    name: zone.name,
    provinces: zone.provinces,
    cities: zone.cities,
    isActive: zone.isActive,
    sortOrder: zone.sortOrder,
    rates: zone.rates.map((rate) => ({
      id: rate.id,
      name: rate.name,
      price: toNumber(rate.price),
      freeFrom: rate.freeFrom ? toNumber(rate.freeFrom) : null,
      etaMinDays: rate.etaMinDays,
      etaMaxDays: rate.etaMaxDays,
      carrierCode: rate.carrier?.code ?? null,
      isActive: rate.isActive,
    })),
  }));

  const carrierRows: CarrierRow[] = carriers.map((carrier) => ({
    code: carrier.code,
    name: carrier.name,
    isActive: carrier.isActive,
    isImplemented: providers.find((p) => p.code === carrier.code)?.isConfigured() ?? false,
    shipmentCount: carrier._count.shipments,
  }));

  const pendingCount = shipments.filter((s) =>
    ["PENDING", "LABEL_CREATED"].includes(s.status),
  ).length;

  return (
    <>
      <AdminPageHeader
        title="Envíos y etiquetas"
        description="Zonas, tarifas, transportistas y las etiquetas pendientes de imprimir."
        actions={
          <Link
            href="/admin/etiquetas?pendientes=1"
            target="_blank"
            className={buttonVariants({ variant: "dark", size: "sm" })}
          >
            <Printer className="size-3.5" />
            Imprimir pendientes ({pendingCount})
          </Link>
        }
      />

      <ShippingManager
        zones={zoneRows}
        carriers={carrierRows}
        canEdit={staff.isSuperAdmin || staff.permissions.has("settings.edit")}
      />

      <AdminCard
        title="Envíos recientes"
        description={pendientes ? "Solo los pendientes de despacho" : undefined}
        className="mt-4"
        padded={false}
        action={
          <Link
            href={pendientes ? "/admin/envios" : "/admin/envios?pendientes=1"}
            className="text-[12px] underline underline-offset-2 hover:text-wine-700"
          >
            {pendientes ? "Ver todos" : "Ver solo pendientes"}
          </Link>
        }
      >
        <AdminTable
          headers={["Pedido", "Cliente", "Transportista", "Tracking", "Estado", "Despacho", "Etiqueta", { label: "", align: "right" }]}
          empty={<p className="text-[13px] text-stone-500">No hay envíos con ese filtro.</p>}
        >
          {shipments.map((shipment) => (
            <tr key={shipment.id}>
              <Td>
                <Link
                  href={`/admin/pedidos/${shipment.order.id}`}
                  className="tabular hover:text-wine-700"
                >
                  #{shipment.order.number}
                </Link>
              </Td>
              <Td>{shipment.order.customerName}</Td>
              <Td className="text-stone-600">{shipment.carrier?.name ?? "—"}</Td>
              <Td className="tabular text-stone-600">{shipment.trackingNumber ?? "—"}</Td>
              <Td>
                <Badge
                  tone={
                    shipment.status === "DELIVERED" ? "success"
                      : shipment.status === "RETURNED" || shipment.status === "FAILED" ? "danger"
                      : shipment.status === "IN_TRANSIT" || shipment.status === "DISPATCHED" ? "info"
                      : "warning"
                  }
                >
                  {shipment.status}
                </Badge>
              </Td>
              <Td className="whitespace-nowrap tabular text-stone-500">
                {shipment.dispatchedAt ? formatDate(shipment.dispatchedAt) : "—"}
              </Td>
              <Td className="text-[12px] text-stone-500">
                {shipment.labels[0]
                  ? `${shipment.labels[0].format === "A4" ? "A4" : "Térmica"} · ${shipment.labels[0].printCount} impresiones`
                  : "Sin generar"}
              </Td>
              <Td align="right">
                <Link
                  href={`/admin/etiquetas?ids=${shipment.id}`}
                  target="_blank"
                  className="text-[12px] underline underline-offset-2 hover:text-wine-700"
                >
                  Imprimir
                </Link>
              </Td>
            </tr>
          ))}
        </AdminTable>
      </AdminCard>
    </>
  );
}
