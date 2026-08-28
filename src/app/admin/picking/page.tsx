import type { Metadata } from "next";
import { ClipboardCheck } from "lucide-react";
import { requireStaff } from "@/infra/auth/guards";
import { prisma } from "@/infra/db/prisma";
import { PICKING_STATUSES } from "@/domain/orders/status";
import { formatDate } from "@/lib/dates";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { PickingList, type PickingOrder } from "@/components/admin/picking-list";
import { EmptyState } from "@/ui/empty-state";

export const metadata: Metadata = { title: "Pedidos a preparar" };

export default async function PickingPage() {
  await requireStaff("orders.prepare");

  const orders = await prisma.order.findMany({
    where: { status: { in: [...PICKING_STATUSES, "PAID"] } },
    orderBy: [{ type: "asc" }, { createdAt: "asc" }],
    include: { items: true },
  });

  const rows: PickingOrder[] = orders.map((order) => {
    const address = order.shippingSnapshot as Record<string, string>;
    const items = order.items.map((item) => {
      const pack = item.packSnapshot as { name: string; quantity: number }[] | null;
      return {
        name: item.name,
        sku: item.sku,
        quantity: item.quantity,
        components: pack ? pack.map((c) => `${c.quantity}× ${c.name}`) : [],
      };
    });

    return {
      id: order.id,
      number: order.number,
      customerName: order.customerName,
      city: address.city ?? "",
      province: address.province ?? "",
      type: order.type,
      status: order.status,
      createdAt: formatDate(order.createdAt),
      note: order.customerNote ?? order.internalNote,
      items,
      bottles: order.items.reduce((acc, item) => {
        const pack = item.packSnapshot as { quantity: number }[] | null;
        const perUnit = pack ? pack.reduce((s, c) => s + (c.quantity ?? 1), 0) : 1;
        return acc + item.quantity * perUnit;
      }, 0),
    };
  });

  return (
    <>
      <AdminPageHeader
        title="Pedidos a preparar"
        description={`${rows.length} pedidos esperando armado · ordenados por antigüedad`}
      />

      {rows.length === 0 ? (
        <EmptyState
          icon={<ClipboardCheck className="size-8" />}
          title="No hay pedidos pendientes de armado"
          description="Cuando entre un pedido pagado o se cobre una suscripción, va a aparecer acá automáticamente."
        />
      ) : (
        <PickingList orders={rows} />
      )}
    </>
  );
}
