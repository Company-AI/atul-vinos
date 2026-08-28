import { notFound } from "next/navigation";
import { FlaskConical } from "lucide-react";
import { prisma } from "@/infra/db/prisma";
import { formatARS } from "@/lib/money";
import { Container, Eyebrow, Heading } from "@/ui/layout";
import { SimulatorPanel } from "./simulator-panel";

type PageProps = {
  params: Promise<{ externalId: string }>;
  searchParams: Promise<{ tipo?: string }>;
};

/**
 * Simulador de pago (solo desarrollo). Reemplaza la pantalla del proveedor
 * cuando no hay credenciales cargadas, para poder recorrer el flujo completo.
 */
export default async function PaymentSimulatorPage({ params, searchParams }: PageProps) {
  if (process.env.NODE_ENV === "production") notFound();

  const { externalId } = await params;
  const { tipo } = await searchParams;
  const isSubscription = tipo === "suscripcion" || externalId.startsWith("mock-sub-");

  if (isSubscription) {
    const subscription = await prisma.subscription.findFirst({
      where: { externalId },
      include: { plan: true, user: true },
    });
    if (!subscription) notFound();

    return (
      <Container size="narrow" className="py-section-sm">
        <Shell
          eyebrow="Simulador de pagos"
          title={`Autorizar débito recurrente — ${subscription.plan.name}`}
          rows={[
            { label: "Socio", value: `${subscription.user.firstName} ${subscription.user.lastName}` },
            { label: "Plan", value: subscription.plan.name },
            { label: "Importe mensual", value: formatARS(subscription.amount) },
            { label: "Suscripción", value: `#${subscription.number}` },
          ]}
        >
          <SimulatorPanel
            externalId={externalId}
            redirectTo="/mi-cuenta/suscripcion"
            kind="subscription"
          />
        </Shell>
      </Container>
    );
  }

  const payment = await prisma.payment.findFirst({
    where: { externalId },
    include: { order: { include: { items: true } } },
  });
  if (!payment?.order) notFound();

  return (
    <Container size="narrow" className="py-section-sm">
      <Shell
        eyebrow="Simulador de pagos"
        title={`Pagar pedido #${payment.order.number}`}
        rows={[
          { label: "Cliente", value: payment.order.customerName },
          { label: "Productos", value: `${payment.order.items.length} ítems` },
          { label: "Total", value: formatARS(payment.amount) },
        ]}
      >
        <SimulatorPanel
          externalId={externalId}
          redirectTo={`/checkout/estado/${payment.order.number}`}
          kind="order"
        />
      </Shell>
    </Container>
  );
}

function Shell({
  eyebrow, title, rows, children,
}: {
  eyebrow: string;
  title: string;
  rows: { label: string; value: string }[];
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="mb-8 flex items-center gap-3 border border-warning-500/30 bg-warning-100 px-4 py-3">
        <FlaskConical className="size-4 shrink-0 text-warning-500" />
        <p className="text-[13px] text-warning-500">
          Entorno de desarrollo: sin credenciales de Mercado Pago cargadas. La confirmación viaja
          por el mismo webhook que usa producción.
        </p>
      </div>

      <Eyebrow>{eyebrow}</Eyebrow>
      <Heading level={1} size="sm" className="mt-3">{title}</Heading>

      <dl className="mt-8 divide-y divide-linen-200 border-y border-linen-200">
        {rows.map((row) => (
          <div key={row.label} className="flex justify-between gap-4 py-3 text-[14px]">
            <dt className="text-stone-500">{row.label}</dt>
            <dd className="tabular text-carbon-900">{row.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-8">{children}</div>
    </>
  );
}
