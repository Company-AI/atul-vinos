import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { prisma } from "@/infra/db/prisma";
import { ORDER_STATUS_LABELS } from "@/domain/orders/status";
import { formatARS } from "@/lib/money";
import { formatDate } from "@/lib/dates";
import { buttonVariants } from "@/ui/button";
import { Container, Eyebrow, Heading } from "@/ui/layout";

export const metadata: Metadata = {
  title: "Estado de tu pedido",
  robots: { index: false, follow: false },
};

type PageProps = { params: Promise<{ number: string }> };

/**
 * El estado se lee SIEMPRE de la base, nunca de los parámetros del redirect.
 * Si el webhook todavía no llegó, se muestra "estamos confirmando el pago".
 */
export default async function CheckoutStatusPage({ params }: PageProps) {
  const { number } = await params;
  const orderNumber = Number(number);
  if (!Number.isFinite(orderNumber)) notFound();

  const order = await prisma.order.findUnique({
    where: { number: orderNumber },
    include: {
      items: true,
      payments: { orderBy: { createdAt: "desc" }, take: 1 },
      shipments: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  if (!order) notFound();

  const payment = order.payments[0];
  const paid = order.status !== "PAYMENT_PENDING" && order.status !== "CANCELLED";
  const rejected = payment?.status === "REJECTED" || order.status === "CANCELLED";

  const state = paid ? "paid" : rejected ? "rejected" : "pending";

  const copy = {
    paid: {
      icon: <CheckCircle2 className="size-10 text-success-500" />,
      eyebrow: "Pedido confirmado",
      title: "¡Gracias! Ya estamos preparando tu pedido.",
      body: "Te enviamos la confirmación por email. Cuando salga de la bodega vas a recibir el número de seguimiento.",
    },
    pending: {
      icon: <Clock className="size-10 text-warning-500" />,
      eyebrow: "Estamos confirmando el pago",
      title: "Recibimos tu pedido y estamos esperando la acreditación.",
      body: "Algunos medios de pago tardan unos minutos. No hace falta que hagas nada: cuando se acredite te avisamos por email y empezamos a preparar tu pedido.",
    },
    rejected: {
      icon: <XCircle className="size-10 text-danger-500" />,
      eyebrow: "El pago no se pudo procesar",
      title: "No pudimos confirmar tu pago.",
      body: "No se descontó stock ni se generó el envío. Podés volver a intentar con otro medio de pago; tu carrito sigue disponible.",
    },
  }[state];

  return (
    <Container size="narrow" className="py-section-sm">
      <div className="text-center">
        <div className="mb-6 flex justify-center">{copy.icon}</div>
        <Eyebrow>{copy.eyebrow}</Eyebrow>
        <Heading level={1} size="md" className="mx-auto mt-4 max-w-[24ch]">
          {copy.title}
        </Heading>
        <p className="mx-auto mt-5 max-w-[56ch] text-[15px] leading-relaxed text-stone-600">
          {copy.body}
        </p>
      </div>

      <div className="mt-12 border border-linen-200 bg-bone-pure p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-linen-200 pb-4">
          <p className="font-display text-display-sm font-light text-carbon-900">
            Pedido #{order.number}
          </p>
          <p className="text-[13px] text-stone-500">
            {formatDate(order.createdAt)} · {ORDER_STATUS_LABELS[order.status]}
          </p>
        </div>

        <ul className="divide-y divide-linen-200">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-4 py-3 text-[14px]">
              <span className="text-carbon-900">
                {item.quantity}× {item.name}
              </span>
              <span className="shrink-0 tabular text-stone-600">{formatARS(item.lineTotal)}</span>
            </li>
          ))}
        </ul>

        <dl className="mt-4 space-y-2 border-t border-linen-200 pt-4 text-[14px]">
          <div className="flex justify-between">
            <dt className="text-stone-500">Envío</dt>
            <dd className="tabular">
              {Number(order.shippingTotal) === 0 ? "Sin cargo" : formatARS(order.shippingTotal)}
            </dd>
          </div>
          <div className="flex justify-between font-medium">
            <dt>Total</dt>
            <dd className="tabular">{formatARS(order.total)}</dd>
          </div>
        </dl>

        {order.shipments[0]?.trackingNumber && (
          <p className="mt-4 border-t border-linen-200 pt-4 text-[13px] text-stone-600">
            Seguimiento: <strong className="font-medium">{order.shipments[0].trackingNumber}</strong>
          </p>
        )}
      </div>

      <div className="mt-10 flex flex-wrap justify-center gap-3">
        {state === "rejected" ? (
          <Link href="/checkout" className={buttonVariants({ variant: "primary", uppercase: true })}>
            Volver a intentar
          </Link>
        ) : (
          <Link href="/mi-cuenta/pedidos" className={buttonVariants({ variant: "dark", uppercase: true })}>
            Ver mis pedidos
          </Link>
        )}
        <Link href="/vinos" className={buttonVariants({ variant: "outline", uppercase: true })}>
          Seguir viendo vinos
        </Link>
      </div>
    </Container>
  );
}
