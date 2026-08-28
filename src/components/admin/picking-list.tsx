"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, Printer } from "lucide-react";
import { bulkGenerateLabels, bulkUpdateOrderStatus, updateOrderStatus } from "@/app/actions/admin-orders";
import { cn } from "@/lib/cn";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Checkbox } from "@/ui/field";
import { toast } from "@/ui/toaster";

export type PickingOrder = {
  id: string;
  number: number;
  customerName: string;
  city: string;
  province: string;
  type: "STORE" | "SUBSCRIPTION";
  status: string;
  createdAt: string;
  note: string | null;
  items: { name: string; sku: string; quantity: number; components: string[] }[];
  bottles: number;
};

/**
 * Vista de depósito (spec §28): pocos datos, tipografía grande, una acción.
 * Pensada para trabajar de pie con un lector de códigos.
 */
export function PickingList({ orders }: { orders: PickingOrder[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();

  const toggle = (id: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const allSelected = orders.length > 0 && selected.size === orders.length;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-[13px] text-stone-600">
          <Checkbox
            checked={allSelected}
            onChange={() => setSelected(allSelected ? new Set() : new Set(orders.map((o) => o.id)))}
          />
          Seleccionar todos ({orders.length})
        </label>

        {selected.size > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="dark"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const result = await bulkUpdateOrderStatus({
                    orderIds: [...selected], status: "READY",
                  });
                  if (result.ok) {
                    toast.success(result.message);
                    setSelected(new Set());
                    router.refresh();
                  } else toast.error(result.error);
                })
              }
            >
              <Check className="size-3.5" />
              Marcar {selected.size} preparados
            </Button>

            <Button
              size="sm"
              variant="subtle"
              disabled={pending}
              onClick={async () => {
                const result = await bulkGenerateLabels([...selected]);
                if (result.ok) {
                  const shipmentIds = (result.data as { shipmentIds?: string[] })?.shipmentIds ?? [];
                  if (shipmentIds.length > 0) {
                    window.open(`/admin/etiquetas?ids=${shipmentIds.join(",")}`, "_blank");
                  }
                  toast.success(result.message);
                  router.refresh();
                } else toast.error(result.error);
              }}
            >
              <Printer className="size-3.5" />
              Etiquetas
            </Button>

            <Button
              size="sm"
              variant="subtle"
              onClick={() => window.open(`/admin/packing-slips?ids=${[...selected].join(",")}`, "_blank")}
            >
              Remitos
            </Button>
          </div>
        )}
      </div>

      <ul className="space-y-3">
        {orders.map((order) => (
          <li
            key={order.id}
            className={cn(
              "rounded-md border bg-bone-pure p-4",
              selected.has(order.id) ? "border-carbon-900" : "border-linen-200",
            )}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={selected.has(order.id)}
                  onChange={() => toggle(order.id)}
                  aria-label={`Seleccionar pedido ${order.number}`}
                  className="mt-1"
                />
                <div>
                  <p className="text-[20px] font-medium tabular leading-none text-carbon-900">
                    PEDIDO #{order.number}
                  </p>
                  <p className="mt-1.5 text-[14px] text-carbon-800">{order.customerName}</p>
                  <p className="text-[13px] text-stone-500">
                    {order.city}, {order.province} · {order.createdAt} · {order.bottles}{" "}
                    {order.bottles === 1 ? "botella" : "botellas"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge tone={order.type === "SUBSCRIPTION" ? "gold" : "neutral"}>
                  {order.type === "SUBSCRIPTION" ? "Club" : "Tienda"}
                </Badge>
                <Link
                  href={`/admin/pedidos/${order.id}`}
                  className="text-[12px] underline underline-offset-2 hover:text-wine-700"
                >
                  Ver detalle
                </Link>
              </div>
            </div>

            <ul className="mt-4 space-y-1.5 border-t border-linen-200 pt-4">
              {order.items.map((item, i) => (
                <li key={`${order.id}-${i}`} className="flex items-baseline gap-3">
                  <span className="w-10 shrink-0 text-[22px] font-medium tabular leading-none text-wine-700">
                    {item.quantity}×
                  </span>
                  <span>
                    <span className="block text-[16px] leading-tight text-carbon-900">
                      {item.name}
                    </span>
                    <span className="block text-[12px] text-stone-500">{item.sku}</span>
                    {item.components.length > 0 && (
                      <span className="mt-0.5 block text-[12px] text-stone-600">
                        Contiene: {item.components.join(" · ")}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>

            {order.note && (
              <p className="mt-3 border-t border-linen-200 pt-3 text-[13px] italic text-warning-500">
                Nota: {order.note}
              </p>
            )}

            <div className="mt-4 flex flex-wrap gap-2 border-t border-linen-200 pt-4">
              <Button
                size="md"
                variant="dark"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    const result = await updateOrderStatus({ orderId: order.id, status: "READY" });
                    if (result.ok) {
                      toast.success(`Pedido #${order.number} preparado.`);
                      router.refresh();
                    } else toast.error(result.error);
                  })
                }
              >
                <Check className="size-4" />
                Marcar preparado
              </Button>

              <Button
                size="md"
                variant="subtle"
                disabled={pending}
                onClick={() => window.open(`/admin/etiquetas?order=${order.id}`, "_blank")}
              >
                <Printer className="size-4" />
                Etiqueta
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
