"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateSettings } from "@/app/actions/admin-settings";
import type { SettingsGroup } from "@/domain/settings";
import { Button } from "@/ui/button";
import { Checkbox, Field, Input, Textarea } from "@/ui/field";
import { toast } from "@/ui/toaster";
import { AdminCard } from "./admin-ui";

/** Etiquetas y ayudas en castellano para cada clave de configuración. */
const LABELS: Record<string, { label: string; hint?: string; long?: boolean }> = {
  name: { label: "Nombre comercial" },
  legalName: { label: "Razón social" },
  tagline: { label: "Bajada de marca" },
  logoUrl: { label: "Logo (fondo claro)" },
  logoLightUrl: { label: "Logo (fondo oscuro)" },
  faviconUrl: { label: "Favicon" },
  email: { label: "Email de contacto" },
  phone: { label: "Teléfono" },
  whatsapp: { label: "WhatsApp", hint: "Solo números con código de país." },
  addressLine: { label: "Dirección" },
  city: { label: "Localidad" },
  province: { label: "Provincia" },
  postalCode: { label: "Código postal" },
  currency: { label: "Moneda" },
  taxIncluded: { label: "Los precios incluyen impuestos" },
  taxPercent: { label: "IVA (%)" },
  instagram: { label: "Instagram" },
  facebook: { label: "Facebook" },
  youtube: { label: "YouTube" },
  requireDocumentAtCheckout: { label: "Pedir DNI obligatorio en el checkout" },

  enabled: { label: "Age gate activado" },
  minAge: { label: "Edad mínima" },
  title: { label: "Título" },
  message: { label: "Mensaje", long: true },
  confirmLabel: { label: "Texto del botón de ingreso" },
  exitLabel: { label: "Texto del botón de salida" },
  legalNote: { label: "Nota legal", long: true },
  imageUrl: { label: "Imagen" },
  backgroundUrl: { label: "Fondo" },
  exitUrl: { label: "A dónde va quien sale" },
  rememberDays: { label: "Recordar la confirmación (días)" },

  defaultProvider: { label: "Transportista por defecto" },
  freeShippingFrom: { label: "Envío gratis desde", hint: "Vacío = nunca." },
  originPostalCode: { label: "CP de origen" },
  originCity: { label: "Localidad de origen" },
  originProvince: { label: "Provincia de origen" },
  bottleWeightGrams: { label: "Peso por botella (g)" },
  packagingWeightGrams: { label: "Peso del embalaje (g)" },
  labelFormatDefault: { label: "Formato de etiqueta por defecto" },
  pickupEnabled: { label: "Permitir retiro en bodega" },
  pickupLabel: { label: "Nombre del retiro" },

  allowPause: { label: "Permitir pausar la suscripción" },
  allowCancel: { label: "Permitir cancelar desde Mi Cuenta" },
  allowPlanChange: { label: "Permitir cambiar de plan" },
  allowSkip: { label: "Permitir omitir un envío" },
  skipCutoffDays: { label: "Días de anticipación para omitir" },
  boxCutoffDay: { label: "Día de cierre del box" },
  showNextBoxToMembers: { label: "Mostrar la próxima selección a los socios" },
  reserveStockForClub: { label: "Reservar stock para el Club" },
  paymentRetryDays: { label: "Días entre reintentos de cobro" },

  provider: { label: "Proveedor de pagos" },
  sandbox: { label: "Modo de pruebas" },
  publicKey: { label: "Clave pública" },
  statementDescriptor: { label: "Texto en el resumen de tarjeta" },
  installmentsEnabled: { label: "Permitir cuotas" },
  maxInstallments: { label: "Máximo de cuotas" },

  defaultTitle: { label: "Título por defecto" },
  titleTemplate: { label: "Plantilla de título", hint: "%s se reemplaza por el título de la página." },
  defaultDescription: { label: "Descripción por defecto", long: true },
  ogImageUrl: { label: "Imagen para redes" },
  ga4Id: { label: "Google Analytics 4" },
  metaPixelId: { label: "Meta Pixel" },
  indexable: { label: "Permitir indexación en buscadores" },

  fromName: { label: "Nombre del remitente" },
  fromEmail: { label: "Email del remitente" },
  replyTo: { label: "Responder a" },
  footerText: { label: "Pie de los emails", long: true },
  notifyAdminEmails: { label: "Avisar a estos emails", hint: "Separados por coma." },

  responsibleDrinking: { label: "Consumo responsable", long: true },
  minorsNotice: { label: "Venta a menores", long: true },
  termsUrl: { label: "URL de términos" },
  privacyUrl: { label: "URL de privacidad" },
  returnsUrl: { label: "URL de cambios y devoluciones" },
};

export function SettingsForm({
  group,
  groupLabel,
  description,
  initial,
  canEdit,
}: {
  group: SettingsGroup;
  groupLabel: string;
  description?: string;
  initial: Record<string, unknown>;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, unknown>>(initial);
  const [pending, startTransition] = useTransition();

  const set = (key: string, value: unknown) => setValues((v) => ({ ...v, [key]: value }));

  return (
    <AdminCard title={groupLabel} description={description}>
      <div className="grid gap-4 sm:grid-cols-2">
        {Object.entries(values).map(([key, value]) => {
          const meta = LABELS[key] ?? { label: key };
          const id = `${group}-${key}`;

          if (typeof value === "boolean") {
            return (
              <label key={key} className="flex items-center gap-2.5 text-[13px] text-carbon-800">
                <Checkbox
                  id={id}
                  checked={value}
                  disabled={!canEdit}
                  onChange={(e) => set(key, e.target.checked)}
                />
                {meta.label}
              </label>
            );
          }

          if (Array.isArray(value)) {
            return (
              <Field key={key} label={meta.label} htmlFor={id} hint={meta.hint} className="sm:col-span-2">
                <Input
                  id={id}
                  value={value.join(", ")}
                  disabled={!canEdit}
                  onChange={(e) =>
                    set(key, e.target.value.split(",").map((v) => v.trim()).filter(Boolean))
                  }
                />
              </Field>
            );
          }

          if (typeof value === "number" || value === null) {
            return (
              <Field key={key} label={meta.label} htmlFor={id} hint={meta.hint}>
                <Input
                  id={id}
                  type="number"
                  value={value === null ? "" : value}
                  disabled={!canEdit}
                  onChange={(e) => set(key, e.target.value === "" ? null : Number(e.target.value))}
                />
              </Field>
            );
          }

          return (
            <Field
              key={key}
              label={meta.label}
              htmlFor={id}
              hint={meta.hint}
              className={meta.long ? "sm:col-span-2" : undefined}
            >
              {meta.long ? (
                <Textarea
                  id={id}
                  value={String(value ?? "")}
                  disabled={!canEdit}
                  onChange={(e) => set(key, e.target.value)}
                />
              ) : (
                <Input
                  id={id}
                  value={String(value ?? "")}
                  disabled={!canEdit}
                  onChange={(e) => set(key, e.target.value)}
                />
              )}
            </Field>
          );
        })}
      </div>

      {canEdit && (
        <Button
          variant="dark"
          size="sm"
          className="mt-5"
          loading={pending}
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await updateSettings({ group, values });
              if (result.ok) {
                toast.success(result.message);
                router.refresh();
              } else toast.error(result.error);
            })
          }
        >
          Guardar {groupLabel.toLowerCase()}
        </Button>
      )}
    </AdminCard>
  );
}
