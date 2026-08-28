"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Copy, Printer } from "lucide-react";
import type { OrderStatus } from "@prisma/client";
import { bulkGenerateLabels, bulkUpdateOrderStatus } from "@/app/actions/admin-orders";
import { ORDER_STATUS_ADMIN_LABELS, ORDER_STATUS_TONES } from "@/domain/orders/status";
import { cn } from "@/lib/cn";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Checkbox, Select } from "@/ui/field";
import { AdminTable, Td } from "./admin-ui";
import { toast } from "@/ui/toaster";

export type OrderRow = {
  id: string;
  number: number;
  createdAt: string;
  customerName: string;
  customerEmail: string;
  type: "STORE" | "SUBSCRIPTION";
  total: string;
  status: OrderStatus;
  paymentStatus: string | null;
  shippingStatus: string | null;
  trackingNumber: string | null;
  carrierName: string | null;
  itemCount: number;
};

const BULK_STATUSES: { value: OrderStatus; label: string }[] = [
  { value: "PREPARING", label: "Marcar preparando" },
  { value: "READY", label: "Marcar preparados" },
  { value: "SHIPPED", label: "Marcar enviados" },
  { value: "DELIVERED", label: "Marcar entregados" },
];

export function OrdersTable({ orders }: { orders: OrderRow[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<OrderStatus>("READY");
  const [pending, startTransition] = useTransition();

  const allSelected = orders.length > 0 && selected.size === orders.length;

  const toggle = (id: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(orders.map((o) => o.id)));

  const run = (
    fn: () => Promise<{ ok: boolean; message?: string; error?: string; data?: unknown }>,
  ) => {
    startTransition(async () => {
      const result = await fn();
      if (result.ok) {
        toast.success(result.message ?? "Listo.");
        setSelected(new Set());
        router.refresh();
      } else {
        toast.error(result.error ?? "No pudimos completar la acción.");
      }
    });
  };

  return (
    <>
      {selected.size > 0 && (
        <div className="sticky top-14 z-10 mb-3 flex flex-wrap items-center gap-3 rounded-md border border-carbon-700 bg-carbon-900 px-4 py-2.5">
          <p className="text-[13px] text-bone">
            {selected.size} {selected.size === 1 ? "pedido" : "pedidos"} seleccionados
          </p>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value as OrderStatus)}
              aria-label="Acción masiva"
              className="h-8 w-auto text-[12px]"
            >
              {BULK_STATUSES.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </Select>

            <Button
              size="sm"
              variant="subtle"
              disabled={pending}
              onClick={() =>
                run(() => bulkUpdateOrderStatus({ orderIds: [...selected], status: bulkStatus }))
              }
            >
              Aplicar
            </Button>

            <Button
              size="sm"
              variant="subtle"
              disabled={pending}
              onClick={async () => {
                const result = await bulkGenerateLabels([...selected]);
                if (result.ok) {
                  toast.success(result.message);
                  const ids = (result.data as { shipmentIds?: string[] })?.shipmentIds ?? [];
                  if (ids.length > 0) {
                    window.open(`/admin/etiquetas?ids=${ids.join(",")}`, "_blank");
                  }
                  setSelected(new Set());
                  router.refresh();
                } else {
                  toast.error(result.error);
                }
              }}
            >
              <Printer className="size-3.5" />
              Etiquetas
            </Button>

            <Button
              size="sm"
              variant="subtle"
              disabled={pending}
              onClick={() =>
                window.open(`/admin/packing-slips?ids=${[...selected].join(",")}`, "_blank")
              }
            >
              Packing slips
            </Button>

            <Button size="sm" variant="quiet" className="text-bone hover:bg-carbon-700"
              onClick={() => setSelected(new Set())}>
              Deseleccionar
            </Button>
          </div>
        </div>
      )}

      <AdminTable
        headers={[
          { label: "", className: "w-8" },
          "Nº",
          "Fecha",
          "Cliente",
          "Tipo",
          { label: "Total", align: "right" },
          "Pago",
          "Preparación",
          "Envío",
          "Tracking",
          { label: "", align: "right" },
        ]}
        empty={
          <p className="text-[13px] text-stone-500">
            No hay pedidos con esos filtros. Probá ampliando el rango de fechas o limpiando los filtros.
          </p>
        }
      >
        {orders.map((order) => (
          <tr key={order.id} className={cn(selected.has(order.id) && "bg-linen-100")}>
            <Td>
              <Checkbox
                checked={selected.has(order.id)}
                onChange={() => toggle(order.id)}
                aria-label={`Seleccionar pedido ${order.number}`}
              />
            </Td>
            <Td>
              <Link
                href={`/admin/pedidos/${order.id}`}
                className="font-medium tabular text-carbon-900 hover:text-wine-700"
              >
                #{order.number}
              </Link>
            </Td>
            <Td className="whitespace-nowrap tabular text-stone-500">{order.createdAt}</Td>
            <Td>
              <span className="block max-w-[180px] truncate">{order.customerName}</span>
              <span className="block max-w-[180px] truncate text-[11px] text-stone-500">
                {order.customerEmail}
              </span>
            </Td>
            <Td>
              <Badge tone={order.type === "SUBSCRIPTION" ? "gold" : "neutral"}>
                {order.type === "SUBSCRIPTION" ? "Club" : "Tienda"}
              </Badge>
            </Td>
            <Td align="right" className="whitespace-nowrap tabular">{order.total}</Td>
            <Td>
              {order.paymentStatus && (
                <Badge
                  tone={
                    order.paymentStatus === "APPROVED" ? "success"
                      : order.paymentStatus === "REJECTED" ? "danger" : "warning"
                  }
                >
                  {order.paymentStatus === "APPROVED" ? "Aprobado"
                    : order.paymentStatus === "REJECTED" ? "Rechazado"
                    : order.paymentStatus === "REFUNDED" ? "Reembolsado" : "Pendiente"}
                </Badge>
              )}
            </Td>
            <Td>
              <Badge tone={ORDER_STATUS_TONES[order.status]}>
                {ORDER_STATUS_ADMIN_LABELS[order.status]}
              </Badge>
            </Td>
            <Td className="text-stone-500">{order.carrierName ?? "—"}</Td>
            <Td>
              {order.trackingNumber ? (
                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard.writeText(order.trackingNumber!);
                    toast.success("Tracking copiado.");
                  }}
                  className="flex items-center gap-1.5 tabular text-carbon-800 hover:text-wine-700"
                >
                  {order.trackingNumber}
                  <Copy className="size-3" />
                </button>
              ) : (
                <span className="text-stone-400">—</span>
              )}
            </Td>
            <Td align="right">
              <Link
                href={`/admin/pedidos/${order.id}`}
                className="text-[12px] underline underline-offset-2 hover:text-wine-700"
              >
                Ver
              </Link>
            </Td>
          </tr>
        ))}
      </AdminTable>

      {orders.length > 0 && (
        <div className="mt-3 flex items-center gap-2 text-[12px] text-stone-500">
          <Checkbox checked={allSelected} onChange={toggleAll} aria-label="Seleccionar todos" />
          Seleccionar los {orders.length} pedidos de esta página
        </div>
      )}
    </>
  );
}
