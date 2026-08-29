"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { recoverSubscriptionPayment, reprocessWebhook } from "@/app/actions/admin-payments";
import { Button } from "@/ui/button";
import { Modal } from "@/ui/modal";
import { toast } from "@/ui/toaster";

export function ReprocessWebhookButton({ webhookEventId }: { webhookEventId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      variant="subtle"
      loading={pending}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await reprocessWebhook(webhookEventId);
          if (result.ok) {
            toast.success(result.message);
            router.refresh();
          } else toast.error(result.error);
        })
      }
    >
      <RefreshCw className="size-3.5" />
      Reprocesar
    </Button>
  );
}

export function RecoverPaymentButton({
  subscriptionId,
  subscriberName,
  amount,
}: {
  subscriptionId: string;
  subscriberName: string;
  amount: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <>
      <Button size="sm" variant="dark" onClick={() => setOpen(true)}>
        Registrar cobro
      </Button>

      <Modal
        open={open}
        onOpenChange={setOpen}
        title="¿Registrar el cobro manualmente?"
        description="Usalo solo cuando el proveedor ya acreditó el pago y el webhook no llegó."
        size="sm"
        footer={
          <>
            <Button variant="subtle" onClick={() => setOpen(false)} disabled={pending}>
              Cancelar
            </Button>
            <Button
              variant="dark"
              loading={pending}
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const result = await recoverSubscriptionPayment({ subscriptionId });
                  if (result.ok) {
                    toast.success(result.message);
                    setOpen(false);
                    router.refresh();
                  } else toast.error(result.error);
                })
              }
            >
              Registrar y generar pedido
            </Button>
          </>
        }
      >
        <p className="text-[13px] leading-relaxed text-stone-600">
          Se va a registrar un cobro de <strong className="text-carbon-900">{amount}</strong> para{" "}
          <strong className="text-carbon-900">{subscriberName}</strong>, crear el ciclo del período
          actual y generar el pedido con el box correspondiente. La operación es idempotente: si el
          ciclo ya existe, no se duplica.
        </p>
      </Modal>
    </>
  );
}
