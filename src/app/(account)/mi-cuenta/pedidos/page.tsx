import type { Metadata } from "next";
import Link from "next/link";
import { Package } from "lucide-react";
import { requireUser } from "@/infra/auth/guards";
import { prisma } from "@/infra/db/prisma";
import { ORDER_STATUS_LABELS, ORDER_STATUS_TONES } from "@/domain/orders/status";
import { formatARS } from "@/lib/money";
import { formatDate } from "@/lib/dates";
import { Badge } from "@/ui/badge";
import { buttonVariants } from "@/ui/button";
import { EmptyState } from "@/ui/empty-state";
import { Eyebrow, Heading } from "@/ui/layout";

export const metadata: Metadata = {
  title: "Mis pedidos",
  robots: { index: false, follow: false },
};

export default async function MyOrdersPage() {
  const user = await requireUser("/mi-cuenta/pedidos");

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      items: true,
      shipments: { orderBy: { createdAt: "desc" }, take: 1, include: { carrier: true } },
    },
  });

  return (
    <>
      <Eyebrow>Mi cuenta</Eyebrow>
      <Heading level={1} size="md" className="mt-3">Mis pedidos</Heading>

      <div className="mt-10">
        {orders.length === 0 ? (
          <EmptyState
            icon={<Package className="size-8" />}
            title="Todavía no hiciste ningún pedido"
            description="Cuando hagas tu primera compra vas a ver acá el estado de cada envío y su seguimiento."
            action={
              <Link href="/vinos" className={buttonVariants({ variant: "dark", uppercase: true })}>
                Ver los vinos
              </Link>
            }
          />
        ) : (
          <ul className="space-y-4">
            {orders.map((order) => {
              const shipment = order.shipments[0];
              return (
                <li key={order.id} className="border border-linen-200 bg-bone-pure">
                  <Link href={`/mi-cuenta/pedidos/${order.number}`} className="block p-5 transition-colors hover:bg-linen-100">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="font-display text-[19px] font-light text-carbon-900">
                          Pedido #{order.number}
                        </p>
                        <p className="mt-1 text-[13px] text-stone-500">
                          {formatDate(order.createdAt)} ·{" "}
                          {order.type === "SUBSCRIPTION" ? "Suscripción del Club" : "Compra en la tienda"}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge tone={ORDER_STATUS_TONES[order.status]}>
                          {ORDER_STATUS_LABELS[order.status]}
                        </Badge>
                        <span className="text-[15px] font-medium tabular text-carbon-900">
                          {formatARS(order.total)}
                        </span>
                      </div>
                    </div>

                    <ul className="mt-4 space-y-1 border-t border-linen-200 pt-4 text-[13px] text-stone-600">
                      {order.items.map((item) => (
                        <li key={item.id}>{item.quantity}× {item.name}</li>
                      ))}
                    </ul>

                    {shipment?.trackingNumber && (
                      <p className="mt-3 text-[13px] text-stone-500">
                        {shipment.carrier?.name ?? "Envío"} · seguimiento{" "}
                        <strong className="font-medium text-carbon-900">
                          {shipment.trackingNumber}
                        </strong>
                      </p>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
