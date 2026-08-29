"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Pause, Play, X } from "lucide-react";
import {
  adminCancelSubscription, adminChangePlan, adminPauseSubscription, adminResumeSubscription,
} from "@/app/actions/admin-subscriptions";
import { Button } from "@/ui/button";
import { Field, Select, Textarea } from "@/ui/field";
import { Modal } from "@/ui/modal";
import { toast } from "@/ui/toaster";

export function SubscriptionAdminActions({
  subscriptionId,
  status,
  currentPlanId,
  plans,
}: {
  subscriptionId: string;
  status: string;
  currentPlanId: string;
  plans: { id: string; name: string; price: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [planModal, setPlanModal] = useState(false);
  const [cancelModal, setCancelModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(currentPlanId);
  const [reason, setReason] = useState("");

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

  if (status === "CANCELLED") {
    return (
      <p className="text-[13px] text-stone-500">
        Suscripción cancelada. El historial de ciclos y pedidos se conserva completo.
      </p>
    );
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {status === "ACTIVE" && (
          <Button size="sm" variant="subtle" disabled={pending}
            onClick={() => run(() => adminPauseSubscription(subscriptionId))}>
            <Pause className="size-3.5" />
            Pausar
          </Button>
        )}

        {(status === "PAUSED" || status === "PAYMENT_FAILED") && (
          <Button size="sm" variant="dark" disabled={pending}
            onClick={() => run(() => adminResumeSubscription(subscriptionId))}>
            <Play className="size-3.5" />
            Reactivar
          </Button>
        )}

        {plans.length > 1 && (
          <Button size="sm" variant="subtle" disabled={pending} onClick={() => setPlanModal(true)}>
            Cambiar plan
          </Button>
        )}

        <Button
          size="sm"
          variant="quiet"
          className="text-danger-500"
          disabled={pending}
          onClick={() => setCancelModal(true)}
        >
          <X className="size-3.5" />
          Cancelar
        </Button>
      </div>

      <Modal
        open={planModal}
        onOpenChange={setPlanModal}
        title="Cambiar el plan del suscriptor"
        description="Aplica desde el próximo ciclo. El pedido del mes en curso no cambia."
        footer={
          <>
            <Button variant="subtle" onClick={() => setPlanModal(false)} disabled={pending}>
              Cancelar
            </Button>
            <Button
              variant="dark"
              loading={pending}
              disabled={pending || selectedPlan === currentPlanId}
              onClick={() =>
                run(() => adminChangePlan(subscriptionId, selectedPlan), () => setPlanModal(false))
              }
            >
              Confirmar
            </Button>
          </>
        }
      >
        <Field label="Plan" htmlFor="admin-plan">
          <Select id="admin-plan" value={selectedPlan} onChange={(e) => setSelectedPlan(e.target.value)}>
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>{plan.name} — {plan.price}</option>
            ))}
          </Select>
        </Field>
      </Modal>

      <Modal
        open={cancelModal}
        onOpenChange={setCancelModal}
        title="¿Cancelar esta suscripción?"
        description="Se cancela también en el proveedor de pagos. No se generan más ciclos."
        size="sm"
        footer={
          <>
            <Button variant="subtle" onClick={() => setCancelModal(false)} disabled={pending}>
              No cancelar
            </Button>
            <Button
              variant="danger"
              loading={pending}
              disabled={pending}
              onClick={() =>
                run(
                  () => adminCancelSubscription(subscriptionId, reason || undefined),
                  () => setCancelModal(false),
                )
              }
            >
              Cancelar suscripción
            </Button>
          </>
        }
      >
        <Field label="Motivo" htmlFor="cancel-reason" hint="Queda en el historial del suscriptor.">
          <Textarea
            id="cancel-reason"
            value={reason}
            maxLength={300}
            onChange={(e) => setReason(e.target.value)}
          />
        </Field>
      </Modal>
    </>
  );
}
