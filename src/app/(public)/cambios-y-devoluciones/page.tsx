import type { Metadata } from "next";
import { LegalPage } from "@/components/site/legal-page";
import { getSettings } from "@/domain/settings/service";

export const metadata: Metadata = {
  title: "Cambios y devoluciones",
  alternates: { canonical: "/cambios-y-devoluciones" },
};

export default async function ReturnsPage() {
  const { company } = await getSettings();

  return (
    <LegalPage
      cmsKey="legal.devoluciones"
      eyebrow="Ayuda"
      title="Cambios y devoluciones"
      fallback={[
        {
          heading: "Si algo llega roto",
          body: `Lo reponemos sin costo. Escribinos a ${company.email} dentro de las 48 horas de recibido el pedido, con una foto del embalaje y de la botella. Coordinamos el reemplazo en el próximo despacho.`,
        },
        {
          heading: "Botón de arrepentimiento",
          body: "Podés arrepentirte de la compra dentro de los 10 días corridos de recibido el pedido, siempre que las botellas estén cerradas y en las mismas condiciones. Escribinos y coordinamos el retiro; el reintegro se hace por el mismo medio de pago.",
        },
        {
          heading: "Vino defectuoso",
          body: "Si al abrir una botella encontrás un defecto de elaboración (corcho, oxidación, refermentación), contanos qué pasó. Nos interesa saberlo y, comprobado el defecto, la reponemos.",
        },
        {
          heading: "Cambios de producto",
          body: "Mientras el pedido no haya salido de la bodega podés cambiar los productos escribiéndonos. Una vez despachado, aplica el procedimiento de devolución.",
        },
        {
          heading: "Suscripción del Club",
          body: "La caja mensual no admite devolución por cambio de preferencia, pero sí por rotura o defecto. Si no querés recibir un mes, podés omitirlo desde Mi Cuenta antes del cierre del box.",
        },
      ]}
    />
  );
}
