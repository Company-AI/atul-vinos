"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { simulateProviderEvent } from "@/app/actions/dev-payments";
import { Button } from "@/ui/button";
import { toast } from "@/ui/toaster";

export function SimulatorPanel({
  externalId,
  redirectTo,
  kind,
}: {
  externalId: string;
  redirectTo: string;
  kind: "order" | "subscription";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [choice, setChoice] = useState<string | null>(null);

  const run = (decision: "approved" | "rejected" | "pending") => {
    setChoice(decision);
    startTransition(async () => {
      const result = await simulateProviderEvent({ externalId, decision });
      if (result.ok) {
        toast.success(result.detail);
        router.push(redirectTo);
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <div className="space-y-3">
      <Button
        variant="primary" size="lg" block uppercase
        loading={pending && choice === "approved"}
        disabled={pending}
        onClick={() => run("approved")}
      >
        Aprobar el pago
      </Button>

      <Button
        variant="outline" size="lg" block uppercase
        loading={pending && choice === "rejected"}
        disabled={pending}
        onClick={() => run("rejected")}
      >
        Rechazar el pago
      </Button>

      {kind === "order" && (
        <Button
          variant="subtle" size="lg" block uppercase
          loading={pending && choice === "pending"}
          disabled={pending}
          onClick={() => run("pending")}
        >
          Dejar pendiente
        </Button>
      )}

      <p className="pt-2 text-[12px] leading-relaxed text-stone-500">
        {kind === "order"
          ? "Aprobar reserva el stock y deja el pedido listo para preparar. Rechazar no toca inventario."
          : "Aprobar crea el ciclo del mes y su pedido. Rechazar marca el ciclo como pago fallido sin generar envío."}
      </p>
    </div>
  );
}
