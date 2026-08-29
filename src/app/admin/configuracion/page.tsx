import type { Metadata } from "next";
import Link from "next/link";
import { requireStaff } from "@/infra/auth/guards";
import { getSettings, GROUP_LABELS, SETTINGS_GROUPS } from "@/domain/settings";
import { getPaymentProvider } from "@/infra/payments/registry";
import { getShippingProvider } from "@/infra/shipping/registry";
import { AdminCard, AdminPageHeader } from "@/components/admin/admin-ui";
import { SettingsForm } from "@/components/admin/settings-form";
import { Badge } from "@/ui/badge";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Configuración" };

const DESCRIPTIONS: Partial<Record<(typeof SETTINGS_GROUPS)[number], string>> = {
  company: "Identidad, contacto y datos fiscales. Se usan en el sitio, los emails y las etiquetas.",
  ageGate: "La pantalla de verificación de edad que ve quien entra por primera vez.",
  shipping: "Origen de los envíos, umbral de envío gratis y formato de etiqueta.",
  club: "Reglas de autogestión de los socios y cierre del box mensual.",
  payments: "Proveedor de pagos y cuotas. Las credenciales se cargan por variables de entorno.",
  seo: "Metadatos por defecto y códigos de analytics.",
  email: "Remitente y pie de los emails transaccionales.",
  legal: "Textos legales y enlaces del footer.",
};

type PageProps = { searchParams: Promise<{ grupo?: string }> };

export default async function AdminSettingsPage({ searchParams }: PageProps) {
  const staff = await requireStaff("settings.view");
  const { grupo } = await searchParams;
  const active = SETTINGS_GROUPS.includes(grupo as never) ? (grupo as (typeof SETTINGS_GROUPS)[number]) : "company";

  const settings = await getSettings();
  const canEdit = staff.isSuperAdmin || staff.permissions.has("settings.edit");
  const paymentProvider = getPaymentProvider();
  const shippingProvider = getShippingProvider(settings.shipping.defaultProvider);

  return (
    <>
      <AdminPageHeader
        title="Configuración"
        description="Todo lo que cambia el comportamiento del sitio sin tocar código."
      />

      <AdminCard title="Estado de las integraciones" className="mb-4">
        <ul className="grid gap-3 sm:grid-cols-3">
          <li className="flex items-center justify-between gap-3 text-[13px]">
            <span className="text-stone-600">Pagos</span>
            <Badge tone={paymentProvider.code === "mercadopago" ? "success" : "warning"}>
              {paymentProvider.name}
            </Badge>
          </li>
          <li className="flex items-center justify-between gap-3 text-[13px]">
            <span className="text-stone-600">Logística</span>
            <Badge tone={shippingProvider.code === "mock" ? "warning" : "success"}>
              {shippingProvider.name}
            </Badge>
          </li>
          <li className="flex items-center justify-between gap-3 text-[13px]">
            <span className="text-stone-600">Email</span>
            <Badge tone={process.env.SMTP_HOST ? "success" : "warning"}>
              {process.env.SMTP_HOST ? "SMTP configurado" : "Consola (desarrollo)"}
            </Badge>
          </li>
        </ul>
        <p className="mt-4 text-[12px] leading-relaxed text-stone-500">
          Las credenciales (Mercado Pago, SMTP, S3, transportistas) se cargan por variables de
          entorno y nunca se guardan en la base ni se exponen al navegador.
        </p>
      </AdminCard>

      <div className="mb-4 flex flex-wrap gap-2">
        {SETTINGS_GROUPS.map((group) => (
          <Link
            key={group}
            href={`/admin/configuracion?grupo=${group}`}
            className={cn(
              "flex h-8 items-center rounded-sm border px-3 text-[12px] transition-colors",
              active === group
                ? "border-carbon-900 bg-carbon-900 text-bone"
                : "border-linen-300 text-carbon-800 hover:border-stone-400",
            )}
          >
            {GROUP_LABELS[group]}
          </Link>
        ))}
      </div>

      <SettingsForm
        key={active}
        group={active}
        groupLabel={GROUP_LABELS[active]}
        description={DESCRIPTIONS[active]}
        initial={settings[active] as unknown as Record<string, unknown>}
        canEdit={canEdit}
      />
    </>
  );
}
