import type { OrderStatus } from "@prisma/client";
import { Check } from "lucide-react";
import { CUSTOMER_TIMELINE } from "@/domain/orders/status";
import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/dates";

const ORDER = ["PAID", "STOCK_RESERVED", "PREPARING", "READY", "SHIPPED", "DELIVERED"];

/** Timeline del pedido para el cliente. Los estados técnicos no se muestran. */
export function OrderTimeline({
  status,
  events,
}: {
  status: OrderStatus;
  events?: { toStatus: OrderStatus | null; createdAt: Date; message: string | null }[];
}) {
  if (status === "CANCELLED" || status === "REFUNDED") {
    return (
      <p className="border border-danger-500/30 bg-danger-100 px-4 py-3 text-[13px] text-danger-500">
        {status === "CANCELLED"
          ? "Este pedido fue cancelado. No se despachó mercadería."
          : "Este pedido fue reembolsado."}
      </p>
    );
  }

  const currentIndex = ORDER.indexOf(status);
  const dateFor = (target: OrderStatus) =>
    events?.find((e) => e.toStatus === target)?.createdAt ?? null;

  return (
    <ol className="space-y-0">
      {CUSTOMER_TIMELINE.map((step, i) => {
        const stepIndex = ORDER.indexOf(step.status);
        const done = currentIndex >= stepIndex;
        const isCurrent = currentIndex === stepIndex;
        const at = dateFor(step.status);
        const isLast = i === CUSTOMER_TIMELINE.length - 1;

        return (
          <li key={step.status} className="flex gap-4">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "grid size-6 shrink-0 place-items-center rounded-full border text-[11px]",
                  done
                    ? "border-success-500 bg-success-500 text-white"
                    : "border-linen-300 bg-bone-pure text-stone-400",
                )}
              >
                {done ? <Check className="size-3" /> : i + 1}
              </span>
              {!isLast && (
                <span
                  className={cn(
                    "my-1 w-px flex-1",
                    currentIndex > stepIndex ? "bg-success-500" : "bg-linen-300",
                  )}
                />
              )}
            </div>

            <div className={cn("pb-6", isLast && "pb-0")}>
              <p
                className={cn(
                  "text-[14px]",
                  isCurrent ? "font-medium text-carbon-900" : done ? "text-carbon-800" : "text-stone-400",
                )}
              >
                {step.label}
              </p>
              {at && (
                <p className="mt-0.5 text-[12px] tabular text-stone-500">{formatDateTime(at)}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
