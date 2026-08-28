import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/infra/auth/guards";
import { prisma } from "@/infra/db/prisma";
import { ALLOWED_TRANSITIONS, ORDER_STATUS_ADMIN_LABELS, ORDER_STATUS_TONES } from "@/domain/orders/status";
import { formatARS, toNumber } from "@/lib/money";
import { formatDate, formatDateTime } from "@/lib/dates";
import { AdminCard, AdminPageHeader, AdminTable, Td } from "@/components/admin/admin-ui";
import { OrderActions } from "@/components/admin/order-actions";
import { Badge } from "@/ui/badge";

export const metadata: Metadata = { title: "Detalle del pedido" };

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminOrderDetailPage({ params }: PageProps) {
  const user = await requireStaff("orders.view");
  const { id } = await params;

  const [order, carriers] = await Promise.all([
    prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        user: true,
        events: { orderBy: { createdAt: "desc" } },
        payments: { orderBy: { createdAt: "desc" } },
        shipments: {
          orderBy: { createdAt: "desc" },
          include: { carrier: true, labels: true, events: { orderBy: { occurredAt: "desc" } } },
        },
        subscription: { include: { plan: true } },
        cycle: true,
        movements: { orderBy: { createdAt: "desc" }, include: { product: true } },
      },
    }),
    prisma.carrier.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  if (!order) notFound();

  const address = order.shippingSnapshot as Record<string, string>;
  const billing = order.billingSnapshot as Record<string, string> | null;
  const snapshot = order.subscriptionSnapshot as Record<string, unknown> | null;
  const shipment = order.shipments[0] ?? null;
  const payment = order.payments[0] ?? null;
  const canSeePrices = user.isSuperAdmin || user.permissions.has("orders.edit") || user.permissions.has("payments.view");

  return (
    <>
      <AdminPageHeader
        breadcrumb={[{ label: "Pedidos", href: "/admin/pedidos" }]}
        title={`Pedido #${order.number}`}
        description={`${formatDate(order.createdAt)} · ${order.type === "SUBSCRIPTION" ? "Suscripción del Club" : "Compra en la tienda"}`}
        actions={
          <div className="flex items-center gap-3">
            <Badge tone={ORDER_STATUS_TONES[order.status]}>
              {ORDER_STATUS_ADMIN_LABELS[order.status]}
            </Badge>
          </div>
        }
      />

      <AdminCard className="mb-4">
        <OrderActions
          orderId={order.id}
          status={order.status}
          allowedTransitions={ALLOWED_TRANSITIONS[order.status]}
          shipment={
            shipment
              ? {
                  id: shipment.id,
                  trackingNumber: shipment.trackingNumber,
                  trackingUrl: shipment.trackingUrl,
                  carrierCode: shipment.carrier?.code ?? null,
                }
              : null
          }
          carriers={carriers.map((c) => ({ code: c.code, name: c.name }))}
          internalNote={order.internalNote}
        />
      </AdminCard>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-4">
          <AdminCard title="Productos" padded={false}>
            <AdminTable
              headers={[
                "Producto", "SKU",
                { label: "Cant.", align: "right" },
                { label: "Unitario", align: "right" },
                { label: "Total", align: "right" },
              ]}
            >
              {order.items.map((item) => {
                const pack = item.packSnapshot as { name: string; quantity: number }[] | null;
                return (
                  <tr key={item.id}>
                    <Td>
                      <div className="flex items-center gap-3">
                        {item.imageUrl && (
                          <Image
                            src={item.imageUrl} alt="" width={28} height={37}
                            className="h-9 w-7 shrink-0 bg-linen-100 object-contain"
                          />
                        )}
                        <div>
                          <p>{item.name}</p>
                          {pack && pack.length > 0 && (
                            <p className="text-[11px] text-stone-500">
                              {pack.map((c) => `${c.quantity}× ${c.name}`).join(" · ")}
                            </p>
                          )}
                        </div>
                      </div>
                    </Td>
                    <Td className="text-stone-500">{item.sku}</Td>
                    <Td align="right" className="tabular">{item.quantity}</Td>
                    <Td align="right" className="tabular">{formatARS(item.unitPrice)}</Td>
                    <Td align="right" className="tabular">{formatARS(item.lineTotal)}</Td>
                  </tr>
                );
              })}
            </AdminTable>

            <div className="border-t border-linen-200 p-4">
              <dl className="ml-auto max-w-xs space-y-1.5 text-[13px]">
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
                <div className="flex justify-between border-t border-linen-200 pt-1.5 font-medium">
                  <dt>Total</dt>
                  <dd className="tabular">{formatARS(order.total)}</dd>
                </div>
              </dl>
            </div>
          </AdminCard>

          {snapshot && (
            <AdminCard title="Snapshot de la suscripción"
              description="Congelado al generar el pedido: no cambia si se edita el plan o el box.">
              <dl className="grid gap-3 text-[13px] sm:grid-cols-2">
                <div>
                  <dt className="text-stone-500">Plan</dt>
                  <dd>{String(snapshot.planName ?? "—")}</dd>
                </div>
                <div>
                  <dt className="text-stone-500">Período</dt>
                  <dd>{String(snapshot.period ?? "—")}</dd>
                </div>
                <div>
                  <dt className="text-stone-500">Botellas</dt>
                  <dd className="tabular">{String(snapshot.bottleCount ?? "—")}</dd>
                </div>
                <div>
                  <dt className="text-stone-500">Envío incluido</dt>
                  <dd>{snapshot.freeShipping ? "Sí" : "No"}</dd>
                </div>
              </dl>
              {order.subscription && (
                <Link
                  href={`/admin/suscripciones/${order.subscription.id}`}
                  className="mt-4 inline-block text-[12px] underline underline-offset-2 hover:text-wine-700"
                >
                  Ver suscripción #{order.subscription.number}
                </Link>
              )}
            </AdminCard>
          )}

          {order.movements.length > 0 && (
            <AdminCard title="Movimientos de stock de este pedido" padded={false}>
              <AdminTable
                headers={["Fecha", "Producto", "Tipo", { label: "Cantidad", align: "right" }, { label: "Stock después", align: "right" }]}
              >
                {order.movements.map((movement) => (
                  <tr key={movement.id}>
                    <Td className="whitespace-nowrap tabular text-stone-500">
                      {formatDateTime(movement.createdAt)}
                    </Td>
                    <Td>{movement.product.name}</Td>
                    <Td>
                      <Badge tone={movement.type === "VENTA" ? "info" : "neutral"}>{movement.type}</Badge>
                    </Td>
                    <Td align="right" className="tabular">{movement.quantity}</Td>
                    <Td align="right" className="tabular text-stone-500">
                      {movement.onHandAfter} / res. {movement.reservedAfter}
                    </Td>
                  </tr>
                ))}
              </AdminTable>
            </AdminCard>
          )}

          <AdminCard title="Historial" padded={false}>
            <ol className="divide-y divide-linen-200">
              {order.events.map((event) => (
                <li key={event.id} className="flex flex-wrap items-baseline gap-3 px-4 py-2.5 text-[13px]">
                  <span className="shrink-0 tabular text-stone-500">
                    {formatDateTime(event.createdAt)}
                  </span>
                  <span className="text-carbon-800">
                    {event.message ??
                      (event.toStatus ? ORDER_STATUS_ADMIN_LABELS[event.toStatus] : event.type)}
                  </span>
                  {event.actorEmail && (
                    <span className="text-[11px] text-stone-500">— {event.actorEmail}</span>
                  )}
                </li>
              ))}
            </ol>
          </AdminCard>
        </div>

        <div className="space-y-4">
          <AdminCard title="Cliente">
            <p className="text-[14px] text-carbon-900">{order.customerName}</p>
            <p className="mt-0.5 text-[13px] text-stone-600">{order.customerEmail}</p>
            {order.customerPhone && (
              <p className="text-[13px] text-stone-600">{order.customerPhone}</p>
            )}
            {order.customerDocument && (
              <p className="text-[13px] text-stone-600">DNI {order.customerDocument}</p>
            )}
            {order.user && (
              <Link
                href={`/admin/clientes/${order.user.id}`}
                className="mt-3 inline-block text-[12px] underline underline-offset-2 hover:text-wine-700"
              >
                Ver ficha del cliente
              </Link>
            )}
          </AdminCard>

          <AdminCard title="Dirección de envío">
            <address className="text-[13px] not-italic leading-relaxed text-carbon-800">
              {address.firstName} {address.lastName}<br />
              {address.street} {address.number}
              {address.apartment ? `, ${address.apartment}` : ""}<br />
              {address.city}, {address.province} ({address.postalCode})<br />
              {address.phone}
              {address.reference ? <><br /><span className="text-stone-500">{address.reference}</span></> : null}
            </address>
            {order.shippingMethod && (
              <p className="mt-3 border-t border-linen-200 pt-3 text-[12px] text-stone-500">
                {order.shippingMethod}
              </p>
            )}
          </AdminCard>

          {billing && (
            <AdminCard title="Facturación">
              <address className="text-[13px] not-italic leading-relaxed text-carbon-800">
                {billing.firstName} {billing.lastName}<br />
                {billing.taxId ? <>CUIT {billing.taxId}<br /></> : null}
                {billing.street} {billing.number}<br />
                {billing.city}, {billing.province} ({billing.postalCode})
              </address>
            </AdminCard>
          )}

          {canSeePrices && (
            <AdminCard title="Pagos" padded={false}>
              <ul className="divide-y divide-linen-200">
                {order.payments.map((p) => (
                  <li key={p.id} className="px-4 py-3 text-[13px]">
                    <div className="flex items-center justify-between gap-3">
                      <Badge
                        tone={
                          p.status === "APPROVED" ? "success"
                            : p.status === "REJECTED" ? "danger"
                            : p.status === "REFUNDED" ? "warning" : "neutral"
                        }
                      >
                        {p.status}
                      </Badge>
                      <span className="tabular">{formatARS(p.amount)}</span>
                    </div>
                    <p className="mt-1.5 text-[12px] text-stone-500">
                      {p.provider}
                      {p.paymentMethod ? ` · ${p.paymentMethod}` : ""}
                      {p.installments ? ` · ${p.installments} cuotas` : ""}
                    </p>
                    {p.externalId && (
                      <p className="text-[11px] tabular text-stone-500">ID {p.externalId}</p>
                    )}
                    {p.failureReason && (
                      <p className="mt-1 text-[12px] text-danger-500">{p.failureReason}</p>
                    )}
                  </li>
                ))}
                {order.payments.length === 0 && (
                  <li className="px-4 py-3 text-[13px] text-stone-500">Sin pagos registrados.</li>
                )}
              </ul>
            </AdminCard>
          )}

          <AdminCard title="Envío">
            {shipment ? (
              <>
                <p className="text-[13px] text-carbon-900">
                  {shipment.carrier?.name ?? "Sin transportista"}
                </p>
                <p className="mt-1 text-[13px] tabular text-carbon-800">
                  {shipment.trackingNumber ?? "Sin tracking"}
                </p>
                <p className="mt-1 text-[12px] text-stone-500">Estado: {shipment.status}</p>
                {shipment.labels.length > 0 && (
                  <Link
                    href={`/admin/etiquetas?order=${order.id}`}
                    target="_blank"
                    className="mt-3 inline-block text-[12px] underline underline-offset-2 hover:text-wine-700"
                  >
                    Imprimir etiqueta ({shipment.labels[0].printCount} impresiones)
                  </Link>
                )}
                {shipment.events.length > 0 && (
                  <ol className="mt-4 space-y-1.5 border-t border-linen-200 pt-3">
                    {shipment.events.map((event) => (
                      <li key={event.id} className="text-[12px] text-stone-600">
                        <span className="tabular text-stone-500">
                          {formatDate(event.occurredAt)}
                        </span>{" "}
                        {event.description ?? event.status}
                      </li>
                    ))}
                  </ol>
                )}
              </>
            ) : (
              <p className="text-[13px] text-stone-500">
                Todavía no se generó el envío. Usá «Generar etiqueta» para crearlo.
              </p>
            )}
          </AdminCard>

          {(order.customerNote || order.internalNote) && (
            <AdminCard title="Notas">
              {order.customerNote && (
                <div className="mb-3">
                  <p className="text-[11px] uppercase tracking-wider text-stone-500">Del cliente</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-carbon-800">
                    {order.customerNote}
                  </p>
                </div>
              )}
              {order.internalNote && (
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-stone-500">Interna</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-carbon-800">
                    {order.internalNote}
                  </p>
                </div>
              )}
            </AdminCard>
          )}
        </div>
      </div>
    </>
  );
}
