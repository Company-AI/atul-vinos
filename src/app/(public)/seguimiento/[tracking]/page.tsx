import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Package } from "lucide-react";
import { prisma } from "@/infra/db/prisma";
import { ORDER_STATUS_LABELS } from "@/domain/orders/status";
import { formatDateTime } from "@/lib/dates";
import { Badge } from "@/ui/badge";
import { buttonVariants } from "@/ui/button";
import { Container, Eyebrow, Heading } from "@/ui/layout";

export const metadata: Metadata = {
  title: "Seguimiento del envío",
  robots: { index: false, follow: false },
};

type PageProps = { params: Promise<{ tracking: string }> };

/**
 * Seguimiento público por número. No expone datos personales: solo el estado
 * del envío y la localidad de destino.
 */
export default async function TrackingPage({ params }: PageProps) {
  const { tracking } = await params;

  const shipment = await prisma.shipment.findFirst({
    where: { trackingNumber: tracking },
    include: {
      carrier: true,
      order: { select: { number: true, status: true, shippingSnapshot: true } },
      events: { orderBy: { occurredAt: "desc" } },
    },
  });
  if (!shipment) notFound();

  const address = shipment.order.shippingSnapshot as Record<string, string>;

  return (
    <Container size="narrow" className="pb-section pt-4">
      <Eyebrow>Seguimiento</Eyebrow>
      <Heading level={1} size="md" className="mt-4">
        Envío {shipment.trackingNumber}
      </Heading>

      <div className="mt-10 border border-linen-200 bg-bone-pure p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Package className="size-5 text-clay-500" />
            <div>
              <p className="text-[15px] text-carbon-900">
                Pedido #{shipment.order.number}
              </p>
              <p className="text-[13px] text-stone-500">
                {shipment.carrier?.name ?? "Logística propia"} · destino {address?.city ?? "—"},{" "}
                {address?.province ?? ""}
              </p>
            </div>
          </div>
          <Badge tone={shipment.status === "DELIVERED" ? "success" : "info"}>
            {ORDER_STATUS_LABELS[shipment.order.status]}
          </Badge>
        </div>

        {shipment.events.length > 0 ? (
          <ol className="mt-8 space-y-4 border-t border-linen-200 pt-6">
            {shipment.events.map((event) => (
              <li key={event.id} className="flex gap-4">
                <span className="shrink-0 text-[13px] tabular text-stone-500">
                  {formatDateTime(event.occurredAt)}
                </span>
                <span className="text-[14px] text-carbon-800">
                  {event.description ?? event.status}
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-8 border-t border-linen-200 pt-6 text-[14px] text-stone-600">
            Todavía no hay movimientos registrados. Cuando el transportista tome el paquete vas a
            ver el detalle acá.
          </p>
        )}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/mi-cuenta/pedidos" className={buttonVariants({ variant: "dark", uppercase: true })}>
          Ver mis pedidos
        </Link>
        <Link href="/contacto" className={buttonVariants({ variant: "outline", uppercase: true })}>
          Necesito ayuda
        </Link>
      </div>
    </Container>
  );
}
