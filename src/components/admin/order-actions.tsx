"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Printer } from "lucide-react";
import type { OrderStatus } from "@prisma/client";
import {
  addOrderNote, generateLabel, updateOrderStatus, updateShipmentTracking,
} from "@/app/actions/admin-orders";
import { ORDER_STATUS_ADMIN_LABELS } from "@/domain/orders/status";
import { Button } from "@/ui/button";
import { Field, Input, Textarea } from "@/ui/field";
import { ConfirmationModal, Modal } from "@/ui/modal";
import { toast } from "@/ui/toaster";

export function OrderActions({
  orderId,
  allowedTransitions,
  shipment,
  carriers,
  internalNote,
}: {
  orderId: string;
  allowedTransitions: OrderStatus[];
  shipment: { id: string; trackingNumber: string | null; trackingUrl: string | null; carrierCode: string | null } | null;
  carriers: { code: string; name: string }[];
  internalNote: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState<OrderStatus | null>(null);
  const [noteModal, setNoteModal] = useState(false);
  const [note, setNote] = useState(internalNote ?? "");
  const [trackingModal, setTrackingModal] = useState(false);
  const [tracking, setTracking] = useState({
    trackingNumber: shipment?.trackingNumber ?? "",
    trackingUrl: shipment?.trackingUrl ?? "",
    carrierCode: shipment?.carrierCode ?? carriers[0]?.code ?? "",
  });

  const run = (fn: () => Promise<{ ok: boolean; message?: string; error?: string }>, after?: () => void) => {
    startTransition(async () => {
      const result = await fn();
      if (result.ok) {
        toast.success(result.message ?? "Listo.");
        after?.();
        router.refresh();
      } else {
        toast.error(result.error ?? "No pudimos completar la acción.");
      }
    });
  };

  const destructive: OrderStatus[] = ["CANCELLED", "REFUNDED"];

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {allowedTransitions
          .filter((next) => !destructive.includes(next))
          .map((next) => (
            <Button
              key={next}
              size="sm"
              variant={next === "READY" || next === "SHIPPED" ? "dark" : "subtle"}
              disabled={pending}
              onClick={() => run(() => updateOrderStatus({ orderId, status: next }))}
            >
              {ORDER_STATUS_ADMIN_LABELS[next]}
            </Button>
          ))}

        <Button
          size="sm"
          variant="subtle"
          disabled={pending}
          onClick={() =>
            run(() => generateLabel(orderId), () => {
              window.open(`/admin/etiquetas?order=${orderId}`, "_blank");
            })
          }
        >
          <Printer className="size-3.5" />
          {shipment ? "Reimprimir etiqueta" : "Generar etiqueta"}
        </Button>

        {shipment && (
          <Button size="sm" variant="subtle" disabled={pending} onClick={() => setTrackingModal(true)}>
            Editar tracking
          </Button>
        )}

        <Button size="sm" variant="subtle" disabled={pending} onClick={() => setNoteModal(true)}>
          Nota interna
        </Button>

        {allowedTransitions
          .filter((next) => destructive.includes(next))
          .map((next) => (
            <Button
              key={next}
              size="sm"
              variant="quiet"
              className="text-danger-500"
              disabled={pending}
              onClick={() => setConfirm(next)}
            >
              {ORDER_STATUS_ADMIN_LABELS[next]}
            </Button>
          ))}
      </div>

      <ConfirmationModal
        open={confirm !== null}
        onOpenChange={(open) => !open && setConfirm(null)}
        title={confirm === "REFUNDED" ? "¿Reembolsar el pedido?" : "¿Cancelar el pedido?"}
        description={
          confirm === "REFUNDED"
            ? "Registrá el reembolso en el proveedor de pagos por separado. Acá solo se actualiza el pedido y el stock."
            : "Se liberan las reservas de stock. Esta acción no se puede deshacer."
        }
        confirmLabel={confirm === "REFUNDED" ? "Reembolsar" : "Cancelar pedido"}
        destructive
        loading={pending}
        onConfirm={() => {
          if (!confirm) return;
          // En un reembolso de pedido ya despachado, la mercadería vuelve al stock.
          run(
            () => updateOrderStatus({ orderId, status: confirm, restock: true }),
            () => setConfirm(null),
          );
        }}
      />

      <Modal
        open={noteModal}
        onOpenChange={setNoteModal}
        title="Nota interna"
        description="Solo la ve el equipo. Queda registrada en el historial del pedido."
        footer={
          <>
            <Button variant="subtle" onClick={() => setNoteModal(false)} disabled={pending}>
              Cancelar
            </Button>
            <Button
              variant="dark"
              loading={pending}
              disabled={pending || !note.trim()}
              onClick={() => run(() => addOrderNote({ orderId, note }), () => setNoteModal(false))}
            >
              Guardar nota
            </Button>
          </>
        }
      >
        <Field label="Nota" htmlFor="order-note">
          <Textarea
            id="order-note"
            value={note}
            maxLength={300}
            onChange={(e) => setNote(e.target.value)}
          />
        </Field>
      </Modal>

      <Modal
        open={trackingModal}
        onOpenChange={setTrackingModal}
        title="Seguimiento del envío"
        footer={
          <>
            <Button variant="subtle" onClick={() => setTrackingModal(false)} disabled={pending}>
              Cancelar
            </Button>
            <Button
              variant="dark"
              loading={pending}
              disabled={pending || !tracking.trackingNumber.trim() || !shipment}
              onClick={() =>
                run(
                  () => updateShipmentTracking({ shipmentId: shipment!.id, ...tracking }),
                  () => setTrackingModal(false),
                )
              }
            >
              Guardar
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Transportista" htmlFor="carrier">
            <select
              id="carrier"
              value={tracking.carrierCode}
              onChange={(e) => setTracking({ ...tracking, carrierCode: e.target.value })}
              className="h-11 w-full rounded-sm border border-linen-300 bg-bone-pure px-3 text-sm"
            >
              {carriers.map((carrier) => (
                <option key={carrier.code} value={carrier.code}>{carrier.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Número de seguimiento" htmlFor="tracking-number" required>
            <Input
              id="tracking-number"
              value={tracking.trackingNumber}
              onChange={(e) => setTracking({ ...tracking, trackingNumber: e.target.value })}
            />
          </Field>
          <Field label="URL de seguimiento" htmlFor="tracking-url"
            hint="Opcional. Si el transportista tiene página de consulta.">
            <Input
              id="tracking-url"
              value={tracking.trackingUrl}
              onChange={(e) => setTracking({ ...tracking, trackingUrl: e.target.value })}
            />
          </Field>
        </div>
      </Modal>
    </>
  );
}
