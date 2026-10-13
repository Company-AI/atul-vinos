import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock, Landmark, MessageCircle, XCircle } from "lucide-react";
import { prisma } from "@/infra/db/prisma";
import { ORDER_STATUS_LABELS } from "@/domain/orders/status";
import {
  datosDeTransferencia, type DatosDeTransferencia,
} from "@/domain/payments/transferencia";
import { getSettings } from "@/domain/settings/service";
import { DatosParaTransferir } from "@/ui/datos-para-transferir";
import { cn } from "@/lib/cn";
import { formatARS, type MoneyInput } from "@/lib/money";
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

  const settings = await getSettings();
  const payment = order.payments[0];
  const paid = order.status !== "PAYMENT_PENDING" && order.status !== "CANCELLED";
  const rejected = payment?.status === "REJECTED" || order.status === "CANCELLED";

  /*
    Los datos se leen de Configuración y no del pedido: si cambió la cuenta
    entre que se hizo la compra y que la persona vuelve a esta pantalla, lo
    que tiene que ver es la cuenta que hoy recibe la plata.

    Si el medio se apagó después, cae en "pending", que ya dice lo correcto:
    estamos esperando el pago. Nunca se muestra un CBU vacío.
  */
  const transferencia =
    payment?.provider === "transferencia" && !paid && !rejected
      ? datosDeTransferencia(settings.payments)
      : null;

  const state = paid
    ? "paid"
    : rejected
      ? "rejected"
      : transferencia
        ? "transferencia"
        : "pending";

  const copy = {
    paid: {
      icon: <CheckCircle2 className="size-10 text-success-500" />,
      eyebrow: "Pedido confirmado",
      title: "¡Gracias! Ya estamos preparando tu pedido.",
      body: "Te enviamos la confirmación por email. Cuando salga del depósito vas a recibir el número de seguimiento.",
    },
    pending: {
      icon: <Clock className="size-10 text-warning-500" />,
      eyebrow: "Estamos confirmando el pago",
      title: "Recibimos tu pedido y estamos esperando la acreditación.",
      body: "Algunos medios de pago tardan unos minutos. No hace falta que hagas nada: cuando se acredite te avisamos por email y empezamos a preparar tu pedido.",
    },
    transferencia: {
      icon: <Landmark className="size-10 text-wine-500" />,
      eyebrow: "Gracias por tu compra",
      title: "Sólo falta que hagas la transferencia.",
      body: "Guardamos tu pedido con el descuento aplicado. Transferí el total a la cuenta de acá abajo y mandanos el comprobante por WhatsApp: lo preparamos apenas lo veamos acreditado.",
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

      {transferencia && (
        <TarjetaDeTransferencia
          datos={transferencia}
          total={order.total}
          numero={order.number}
          whatsapp={settings.company.whatsapp}
        />
      )}

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

/**
 * Qué tiene que hacer la persona ahora: a qué cuenta girar, cuánto, con qué
 * referencia, y por dónde avisarnos.
 *
 * El número de pedido va como referencia porque es lo único que permite
 * cruzar un movimiento del banco con una compra: sin eso, conciliar es
 * adivinar quién mandó qué.
 */
function TarjetaDeTransferencia({
  datos,
  total,
  numero,
  whatsapp,
}: {
  datos: DatosDeTransferencia;
  total: MoneyInput;
  numero: number;
  whatsapp: string;
}) {
  /*
    wa.me sólo acepta dígitos: un "+54 9 358…" cargado con espacios en
    Configuración rompe el enlace en silencio.
  */
  const numeroWhatsapp = whatsapp.replace(/\D/g, "");
  const mensaje = `Hola! Hice el pedido #${numero} por ${formatARS(total)} y les paso el comprobante de la transferencia.`;

  return (
    <div className="mt-10 border border-wine-500/30 bg-wine-500/[0.04] p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-linen-200 pb-4">
        <p className="eyebrow text-wine-500">Transferí este importe</p>
        <p className="text-2xl font-medium tabular text-carbon-900">{formatARS(total)}</p>
      </div>

      <DatosParaTransferir datos={datos} className="mt-2" />

      <div className="mt-2 flex items-center justify-between gap-4 border-t border-linen-200 py-2.5 text-[14px]">
        <span className="shrink-0 text-stone-500">Referencia</span>
        <span className="truncate font-medium tabular text-carbon-900">Pedido #{numero}</span>
      </div>

      {numeroWhatsapp && (
        <>
          <a
            href={`https://wa.me/${numeroWhatsapp}?text=${encodeURIComponent(mensaje)}`}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ variant: "primary", size: "lg", block: true, uppercase: true }),
              "mt-5 gap-2",
            )}
          >
            <MessageCircle className="size-4" />
            Enviar el comprobante por WhatsApp
          </a>
          <p className="mt-3 text-center text-[12px] leading-relaxed text-stone-500">
            Se abre el chat con el mensaje escrito. Adjuntá la captura de la transferencia y listo.
          </p>
        </>
      )}
    </div>
  );
}
