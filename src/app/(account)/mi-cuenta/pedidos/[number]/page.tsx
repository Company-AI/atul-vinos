import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { requireUser } from "@/infra/auth/guards";
import { prisma } from "@/infra/db/prisma";
import { ORDER_STATUS_LABELS, ORDER_STATUS_TONES } from "@/domain/orders/status";
import { formatARS, toNumber } from "@/lib/money";
import { formatDate, formatDateTime } from "@/lib/dates";
import { OrderTimeline } from "@/components/account/order-timeline";
import { Badge } from "@/ui/badge";
import { Eyebrow, Heading } from "@/ui/layout";

export const metadata: Metadata = {
  title: "Detalle del pedido",
  robots: { index: false, follow: false },
};

type PageProps = { params: Promise<{ number: string }> };

export default async function MyOrderDetailPage({ params }: PageProps) {
  const { number } = await params;
  const user = await requireUser("/mi-cuenta/pedidos");
  const orderNumber = Number(number);
  if (!Number.isFinite(orderNumber)) notFound();

  const order = await prisma.order.findFirst({
    where: { number: orderNumber, userId: user.id },
    include: {
      items: true,
      events: { orderBy: { createdAt: "asc" } },
      shipments: { orderBy: { createdAt: "desc" }, take: 1, include: { carrier: true, events: true } },
      payments: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  if (!order) notFound();

  const shipment = order.shipments[0];
  const address = order.shippingSnapshot as Record<string, string>;
  const snapshot = order.subscriptionSnapshot as Record<string, unknown> | null;

  return (
    <>
      <Link
        href="/mi-cuenta/pedidos"
        className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-stone-500 hover:text-carbon-900"
      >
        <ChevronLeft className="size-3.5" />
        Volver a mis pedidos
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Eyebrow>{formatDate(order.createdAt)}</Eyebrow>
          <Heading level={1} size="md" className="mt-3">Pedido #{order.number}</Heading>
        </div>
        <Badge tone={ORDER_STATUS_TONES[order.status]}>{ORDER_STATUS_LABELS[order.status]}</Badge>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1.5fr_1fr] lg:gap-14">
        <div>
          <h2 className="eyebrow mb-5 text-stone-500">Seguimiento</h2>
          <OrderTimeline status={order.status} events={order.events} />

          {shipment?.trackingNumber && (
            <div className="mt-6 border border-linen-200 bg-bone-pure p-5">
              <p className="text-[13px] text-stone-500">
                {shipment.carrier?.name ?? "Envío"}
              </p>
              <p className="mt-1 flex items-center gap-2 text-[15px] font-medium tabular text-carbon-900">
                {shipment.trackingNumber}
                {shipment.trackingUrl && (
                  <Link
                    href={shipment.trackingUrl}
                    className="text-[12px] font-normal underline underline-offset-4 hover:text-wine-700"
                  >
                    Ver seguimiento
                  </Link>
                )}
              </p>
            </div>
          )}

          <h2 className="eyebrow mb-4 mt-10 text-stone-500">Productos</h2>
          <ul className="divide-y divide-linen-200 border-y border-linen-200">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-center gap-4 py-4">
                {item.imageUrl && (
                  <Image
                    src={item.imageUrl} alt="" width={48} height={64}
                    className="h-16 w-12 shrink-0 bg-linen-100 object-contain"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] text-carbon-900">{item.name}</p>
                  <p className="text-[13px] text-stone-500">
                    {item.quantity} × {formatARS(item.unitPrice)}
                  </p>
                </div>
                <span className="shrink-0 text-[14px] tabular text-carbon-900">
                  {formatARS(item.lineTotal)}
                </span>
              </li>
            ))}
          </ul>

          {snapshot && (
            <div className="mt-8 border border-linen-200 bg-linen-100 p-5">
              <p className="eyebrow mb-2 text-stone-500">Caja del Club</p>
              <p className="text-[14px] text-carbon-900">
                {String(snapshot.planName ?? "")} · {String(snapshot.period ?? "")}
              </p>
              {snapshot.curatorNote ? (
                <p className="mt-2 text-[13px] leading-relaxed text-stone-600">
                  {String(snapshot.curatorNote)}
                </p>
              ) : null}
            </div>
          )}
        </div>

        <aside className="space-y-8">
          <div className="border border-linen-200 bg-bone-pure p-5">
            <h2 className="eyebrow mb-4 text-stone-500">Resumen</h2>
            <dl className="space-y-2 text-[14px]">
              <div className="flex justify-between">
                <dt className="text-stone-500">Subtotal</dt>
                <dd className="tabular">{formatARS(order.subtotal)}</dd>
              </div>
              {toNumber(order.discountTotal) > 0 && (
                <div className="flex justify-between">
                  <dt className="text-stone-500">
                    Descuentos {order.couponCode ? `(${order.couponCode})` : ""}
                  </dt>
                  <dd className="tabular text-success-500">−{formatARS(order.discountTotal)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-stone-500">Envío</dt>
                <dd className="tabular">
                  {toNumber(order.shippingTotal) === 0 ? "Sin cargo" : formatARS(order.shippingTotal)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-linen-200 pt-2 font-medium">
                <dt>Total</dt>
                <dd className="tabular">{formatARS(order.total)}</dd>
              </div>
            </dl>
          </div>

          <div className="border border-linen-200 bg-bone-pure p-5">
            <h2 className="eyebrow mb-3 text-stone-500">Envío</h2>
            <address className="text-[14px] not-italic leading-relaxed text-carbon-800">
              {address.firstName} {address.lastName}<br />
              {address.street} {address.number}
              {address.apartment ? `, ${address.apartment}` : ""}<br />
              {address.city}, {address.province} ({address.postalCode})<br />
              {address.phone}
            </address>
            {order.shippingMethod && (
              <p className="mt-3 text-[13px] text-stone-500">{order.shippingMethod}</p>
            )}
          </div>

          {order.events.length > 0 && (
            <div className="border border-linen-200 bg-bone-pure p-5">
              <h2 className="eyebrow mb-3 text-stone-500">Historial</h2>
              <ol className="space-y-2.5">
                {order.events.map((event) => (
                  <li key={event.id} className="text-[13px]">
                    <p className="text-carbon-800">
                      {event.message ??
                        (event.toStatus ? ORDER_STATUS_LABELS[event.toStatus] : "Actualización")}
                    </p>
                    <p className="text-[12px] tabular text-stone-500">
                      {formatDateTime(event.createdAt)}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
