"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Pause, Play, SkipForward, X } from "lucide-react";
import {
  cancelMySubscription, changeMyPlan, pauseMySubscription,
  resumeMySubscription, skipMyNextShipment, updateSubscriptionAddress,
} from "@/app/actions/subscriptions";
import { Button } from "@/ui/button";
import { ConfirmationModal, Modal } from "@/ui/modal";
import { Field, Select, Textarea } from "@/ui/field";
import { toast } from "@/ui/toaster";

export type ManagerRules = {
  allowPause: boolean;
  allowCancel: boolean;
  allowPlanChange: boolean;
  allowSkip: boolean;
  skipCutoffDays: number;
};

/** Autogestión del socio (spec §20). Las reglas vienen de la configuración. */
export function SubscriptionManager({
  subscriptionId,
  status,
  skipNextCycle,
  rules,
  plans,
  currentPlanId,
  addresses,
  currentAddressId,
}: {
  subscriptionId: string;
  status: string;
  skipNextCycle: boolean;
  rules: ManagerRules;
  plans: { id: string; name: string; price: string }[];
  currentPlanId: string;
  addresses: { id: string; label: string }[];
  currentAddressId: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [planModal, setPlanModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(currentPlanId);
  const [addressModal, setAddressModal] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(currentAddressId ?? "");

  const run = (fn: () => Promise<{ ok: boolean; error?: string; message?: string }>, after?: () => void) => {
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

  const isActive = status === "ACTIVE";
  const isPaused = status === "PAUSED";
  const isCancelled = status === "CANCELLED";

  if (isCancelled) {
    return (
      <p className="border border-linen-300 bg-linen-100 px-4 py-3 text-[13px] leading-relaxed text-stone-600">
        Tu suscripción está cancelada. Todo tu historial de cobros y envíos sigue disponible acá.
        Si querés volver, podés suscribirte de nuevo desde el Club.
      </p>
    );
  }

  return (
    <>
      <div className="flex flex-wrap gap-3">
        {rules.allowSkip && isActive && (
          <Button
            variant={skipNextCycle ? "subtle" : "outline"}
            disabled={pending}
            onClick={() => run(() => skipMyNextShipment(subscriptionId, !skipNextCycle))}
          >
            <SkipForward className="size-4" />
            {skipNextCycle ? "No omitir el próximo envío" : "Omitir el próximo envío"}
          </Button>
        )}

        {rules.allowPlanChange && (isActive || isPaused) && plans.length > 1 && (
          <Button variant="outline" disabled={pending} onClick={() => setPlanModal(true)}>
            Cambiar de plan
          </Button>
        )}

        {addresses.length > 0 && (
          <Button variant="outline" disabled={pending} onClick={() => setAddressModal(true)}>
            Cambiar dirección
          </Button>
        )}

        {rules.allowPause && isActive && (
          <Button
            variant="subtle"
            disabled={pending}
            onClick={() => run(() => pauseMySubscription(subscriptionId))}
          >
            <Pause className="size-4" />
            Pausar
          </Button>
        )}

        {isPaused && (
          <Button
            variant="dark"
            disabled={pending}
            onClick={() => run(() => resumeMySubscription(subscriptionId))}
          >
            <Play className="size-4" />
            Reactivar
          </Button>
        )}

        {rules.allowCancel && (
          <Button variant="quiet" disabled={pending} onClick={() => setConfirmCancel(true)}>
            <X className="size-4" />
            Cancelar suscripción
          </Button>
        )}
      </div>

      {rules.allowSkip && isActive && (
        <p className="mt-3 text-[12px] text-stone-500">
          Podés omitir un envío hasta {rules.skipCutoffDays} días antes del cierre del box.
        </p>
      )}

      {/* Cambio de plan */}
      <Modal
        open={planModal}
        onOpenChange={setPlanModal}
        title="Cambiar de plan"
        description="El cambio se aplica en tu próximo envío. La caja del mes en curso no se modifica."
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
                run(() => changeMyPlan(subscriptionId, selectedPlan), () => setPlanModal(false))
              }
            >
              Confirmar cambio
            </Button>
          </>
        }
      >
        <Field label="Nuevo plan" htmlFor="plan-select">
          <Select
            id="plan-select"
            value={selectedPlan}
            onChange={(e) => setSelectedPlan(e.target.value)}
          >
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name} — {plan.price} / mes
              </option>
            ))}
          </Select>
        </Field>
      </Modal>

      {/* Cambio de dirección */}
      <Modal
        open={addressModal}
        onOpenChange={setAddressModal}
        title="Dirección de tus envíos"
        description="Se aplica a partir del próximo envío del Club."
        footer={
          <>
            <Button variant="subtle" onClick={() => setAddressModal(false)} disabled={pending}>
              Cancelar
            </Button>
            <Button
              variant="dark"
              loading={pending}
              disabled={pending || !selectedAddress}
              onClick={() =>
                run(
                  () => updateSubscriptionAddress(subscriptionId, selectedAddress),
                  () => setAddressModal(false),
                )
              }
            >
              Guardar
            </Button>
          </>
        }
      >
        <Field label="Elegí una dirección" htmlFor="address-select">
          <Select
            id="address-select"
            value={selectedAddress}
            onChange={(e) => setSelectedAddress(e.target.value)}
          >
            <option value="">Elegí una dirección</option>
            {addresses.map((address) => (
              <option key={address.id} value={address.id}>{address.label}</option>
            ))}
          </Select>
        </Field>
      </Modal>

      {/* Baja */}
      <Modal
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        title="¿Cancelar tu suscripción?"
        description="No vamos a hacer más cobros. Tu historial de envíos queda disponible."
        size="sm"
        footer={
          <>
            <Button variant="subtle" onClick={() => setConfirmCancel(false)} disabled={pending}>
              Mantener mi suscripción
            </Button>
            <Button
              variant="danger"
              loading={pending}
              disabled={pending}
              onClick={() =>
                run(
                  () => cancelMySubscription(subscriptionId, cancelReason || undefined),
                  () => setConfirmCancel(false),
                )
              }
            >
              Cancelar suscripción
            </Button>
          </>
        }
      >
        <Field
          label="¿Nos contás por qué?"
          htmlFor="cancel-reason"
          hint="Opcional, pero nos ayuda a mejorar el Club."
        >
          <Textarea
            id="cancel-reason"
            value={cancelReason}
            maxLength={300}
            onChange={(e) => setCancelReason(e.target.value)}
          />
        </Field>
      </Modal>
    </>
  );
}
