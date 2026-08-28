import type { Metadata } from "next";
import { requireStaff } from "@/infra/auth/guards";
import { prisma } from "@/infra/db/prisma";
import { getSettings } from "@/domain/settings/service";
import { buildLabelData, markLabelsPrinted } from "@/infra/labels/render";
import { LabelSheet } from "@/components/admin/label-sheet";
import { EmptyState } from "@/ui/empty-state";

export const metadata: Metadata = { title: "Etiquetas" };

type PageProps = {
  searchParams: Promise<{ ids?: string; order?: string; pendientes?: string }>;
};

/**
 * Hoja de impresión de etiquetas. Acepta:
 *   ?ids=shipmentId,shipmentId    lote seleccionado
 *   ?order=orderId                una etiqueta
 *   ?pendientes=1                 todo lo que está listo para despachar
 */
export default async function LabelsPage({ searchParams }: PageProps) {
  await requireStaff("orders.labels");
  const { ids, order, pendientes } = await searchParams;
  const settings = await getSettings();

  let shipmentIds: string[] = [];

  if (ids) {
    shipmentIds = ids.split(",").map((id) => id.trim()).filter(Boolean);
  } else if (order) {
    const shipments = await prisma.shipment.findMany({
      where: { orderId: order, status: { not: "CANCELLED" } },
      select: { id: true },
    });
    shipmentIds = shipments.map((s) => s.id);
  } else if (pendientes) {
    const shipments = await prisma.shipment.findMany({
      where: { status: { in: ["PENDING", "LABEL_CREATED"] } },
      orderBy: { createdAt: "asc" },
      take: 100,
      select: { id: true },
    });
    shipmentIds = shipments.map((s) => s.id);
  }

  const labels = await buildLabelData(shipmentIds);
  if (labels.length > 0) await markLabelsPrinted(shipmentIds);

  if (labels.length === 0) {
    return (
      <div className="mx-auto max-w-lg py-16">
        <EmptyState
          title="No hay etiquetas para imprimir"
          description="Seleccioná pedidos en la lista y usá «Etiquetas», o generá la etiqueta desde el detalle del pedido."
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[220mm] print:max-w-none">
      <LabelSheet labels={labels} defaultFormat={settings.shipping.labelFormatDefault} />
    </div>
  );
}
