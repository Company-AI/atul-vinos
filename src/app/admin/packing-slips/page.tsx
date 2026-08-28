import type { Metadata } from "next";
import { requireStaff } from "@/infra/auth/guards";
import { prisma } from "@/infra/db/prisma";
import { getSettings } from "@/domain/settings/service";
import { formatARS, toNumber } from "@/lib/money";
import { formatDate } from "@/lib/dates";
import { PrintButton } from "@/components/admin/print-button";
import { EmptyState } from "@/ui/empty-state";

export const metadata: Metadata = { title: "Packing slips" };

type PageProps = { searchParams: Promise<{ ids?: string }> };

/** Remito de armado para el depósito: qué va en la caja, sin precios si no aplica. */
export default async function PackingSlipsPage({ searchParams }: PageProps) {
  await requireStaff("orders.prepare");
  const { ids } = await searchParams;
  const orderIds = (ids ?? "").split(",").map((id) => id.trim()).filter(Boolean);

  const [orders, settings] = await Promise.all([
    orderIds.length
      ? prisma.order.findMany({
          where: { id: { in: orderIds } },
          include: { items: true },
          orderBy: { number: "asc" },
        })
      : [],
    getSettings(),
  ]);

  if (orders.length === 0) {
    return (
      <div className="mx-auto max-w-lg py-16">
        <EmptyState
          title="No hay pedidos seleccionados"
          description="Elegí pedidos en la lista y usá «Packing slips»."
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[210mm]">
      <div className="mb-5 print:hidden">
        <PrintButton label={`Imprimir ${orders.length} remitos`} />
      </div>

      <style>{`@media print { .slip { page-break-after: always; } .print\\:hidden { display:none !important; } }`}</style>

      {orders.map((order) => {
        const address = order.shippingSnapshot as Record<string, string>;
        const snapshot = order.subscriptionSnapshot as Record<string, unknown> | null;

        return (
          <article key={order.id} className="slip mb-8 border border-carbon-900 bg-white p-6 text-carbon-950">
            <header className="flex items-start justify-between gap-6 border-b border-carbon-900 pb-4">
              <div>
                <p className="text-[15px] font-bold uppercase">{settings.company.legalName}</p>
                <p className="text-[11px]">
                  {settings.company.addressLine} · {settings.company.city}, {settings.company.province}
                </p>
                <p className="text-[11px]">{settings.company.email} · {settings.company.phone}</p>
              </div>
              <div className="text-right">
                <p className="text-[20px] font-bold tabular">#{order.number}</p>
                <p className="text-[11px]">{formatDate(order.createdAt)}</p>
                <p className="text-[11px] font-bold uppercase">
                  {order.type === "SUBSCRIPTION" ? "Caja del Club" : "Pedido de tienda"}
                </p>
              </div>
            </header>

            <div className="grid gap-6 py-4 sm:grid-cols-2">
              <div>
                <p className="text-[9px] uppercase tracking-wider">Enviar a</p>
                <p className="mt-1 text-[13px] font-bold uppercase">{order.customerName}</p>
                <p className="text-[11px] leading-snug">
                  {address.street} {address.number}
                  {address.apartment ? `, ${address.apartment}` : ""}<br />
                  {address.city}, {address.province} (CP {address.postalCode})<br />
                  {address.phone}
                </p>
                {address.reference && (
                  <p className="mt-1 text-[10px] italic">{address.reference}</p>
                )}
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider">Envío</p>
                <p className="mt-1 text-[11px]">{order.shippingMethod ?? "—"}</p>
                {snapshot && (
                  <>
                    <p className="mt-2 text-[9px] uppercase tracking-wider">Plan</p>
                    <p className="text-[11px]">
                      {String(snapshot.planName ?? "")} · {String(snapshot.period ?? "")}
                    </p>
                  </>
                )}
                {order.customerNote && (
                  <>
                    <p className="mt-2 text-[9px] uppercase tracking-wider">Nota del cliente</p>
                    <p className="text-[11px] italic">{order.customerNote}</p>
                  </>
                )}
              </div>
            </div>

            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr className="border-y border-carbon-900">
                  <th className="py-1.5 text-left font-bold uppercase">Producto</th>
                  <th className="py-1.5 text-left font-bold uppercase">SKU</th>
                  <th className="py-1.5 text-right font-bold uppercase">Cant.</th>
                  <th className="py-1.5 text-center font-bold uppercase">Armado</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => {
                  const pack = item.packSnapshot as { name: string; quantity: number }[] | null;
                  return (
                    <tr key={item.id} className="border-b border-stone-300">
                      <td className="py-2">
                        {item.name}
                        {pack && pack.length > 0 && (
                          <span className="block text-[10px] text-stone-600">
                            {pack.map((c) => `${c.quantity}× ${c.name}`).join(" · ")}
                          </span>
                        )}
                      </td>
                      <td className="py-2">{item.sku}</td>
                      <td className="py-2 text-right text-[14px] font-bold tabular">{item.quantity}</td>
                      <td className="py-2 text-center">
                        <span className="inline-block size-4 border border-carbon-900" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <footer className="mt-4 flex items-end justify-between gap-6 border-t border-carbon-900 pt-3">
              <p className="text-[10px] leading-snug">
                Verificar que las botellas no tengan roturas y usar separadores de cartón.<br />
                {settings.legal.minorsNotice}
              </p>
              <div className="text-right text-[11px]">
                <p>Total del pedido</p>
                <p className="text-[15px] font-bold tabular">{formatARS(order.total)}</p>
                {toNumber(order.discountTotal) > 0 && (
                  <p className="text-[10px]">Incluye descuentos por {formatARS(order.discountTotal)}</p>
                )}
              </div>
            </footer>
          </article>
        );
      })}
    </div>
  );
}
