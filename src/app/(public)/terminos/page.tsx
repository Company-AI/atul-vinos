import type { Metadata } from "next";
import { LegalPage } from "@/components/site/legal-page";
import { getSettings } from "@/domain/settings/service";

export const metadata: Metadata = {
  title: "Términos y condiciones",
  alternates: { canonical: "/terminos" },
};

export default async function TermsPage() {
  const { company, legal } = await getSettings();

  return (
    <LegalPage
      cmsKey="legal.terminos"
      eyebrow="Legales"
      title="Términos y condiciones"
      fallback={[
        {
          heading: "Quiénes somos",
          body: `Este sitio es operado por ${company.legalName}, con domicilio en ${company.addressLine}, ${company.city}, ${company.province}. Podés escribirnos a ${company.email}.`,
        },
        {
          heading: "Venta a mayores de edad",
          body: `${legal.minorsNotice} Al confirmar una compra declarás ser mayor de 18 años. Nos reservamos el derecho de solicitar documento al momento de la entrega y de cancelar el pedido si no se acredita la mayoría de edad.`,
        },
        {
          heading: "Precios y disponibilidad",
          body: "Los precios están expresados en pesos argentinos e incluyen impuestos, salvo indicación en contrario. La disponibilidad se verifica al confirmar el pedido: si un producto se agota entre la compra y la preparación, te contactamos para reemplazarlo o reintegrarte el importe.",
        },
        {
          heading: "Pagos",
          body: "Los pagos se procesan a través del proveedor habilitado. No almacenamos datos de tarjetas en nuestros sistemas. Un pedido se considera confirmado solo cuando el proveedor de pagos acredita la operación.",
        },
        {
          heading: "Suscripciones del Club",
          body: "La suscripción al Club se cobra automáticamente según la frecuencia del plan elegido. No tiene permanencia mínima: podés pausarla o cancelarla en cualquier momento desde Mi Cuenta. El cobro ya realizado da derecho al envío correspondiente a ese período.",
        },
        {
          heading: "Envíos",
          body: "Los plazos publicados son estimados y dependen del transportista. La entrega requiere una persona mayor de 18 años en el domicilio indicado.",
        },
        {
          heading: "Cambios en estos términos",
          body: "Podemos actualizar estos términos. La versión vigente es la publicada en esta página al momento de tu compra.",
        },
      ]}
    />
  );
}
