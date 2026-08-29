import type { Metadata } from "next";
import { LegalPage } from "@/components/site/legal-page";
import { getSettings } from "@/domain/settings/service";

export const metadata: Metadata = {
  title: "Política de privacidad",
  alternates: { canonical: "/privacidad" },
};

export default async function PrivacyPage() {
  const { company } = await getSettings();

  return (
    <LegalPage
      cmsKey="legal.privacidad"
      eyebrow="Legales"
      title="Política de privacidad"
      fallback={[
        {
          heading: "Qué datos guardamos",
          body: "Guardamos los datos que nos das para operar tu compra: nombre, email, teléfono, documento cuando corresponde, y direcciones de envío y facturación. También el historial de pedidos y, si sos socio, el de tu suscripción.",
        },
        {
          heading: "Para qué los usamos",
          body: "Para procesar y despachar tus pedidos, cobrar la suscripción del Club, enviarte el seguimiento y responder tus consultas. Si diste tu consentimiento, también para enviarte novedades; podés darte de baja en cualquier momento.",
        },
        {
          heading: "Datos de pago",
          body: "No almacenamos números de tarjeta ni códigos de seguridad. El procesamiento lo hace íntegramente el proveedor de pagos; nosotros solo guardamos el identificador de la operación y su estado.",
        },
        {
          heading: "Con quién los compartimos",
          body: "Solo con quienes necesitan intervenir para completar tu compra: el proveedor de pagos y el transportista. No vendemos ni cedemos datos personales a terceros con fines publicitarios.",
        },
        {
          heading: "Tus derechos",
          body: `Podés acceder, rectificar o solicitar la supresión de tus datos escribiendo a ${company.email}. Conservamos la información de facturación por el plazo que exige la normativa fiscal.`,
        },
        {
          heading: "Cookies",
          body: "Usamos cookies propias para mantener tu sesión, recordar tu carrito y guardar la confirmación de edad. No usamos cookies de terceros con fines publicitarios salvo que actives las herramientas de analítica configuradas.",
        },
      ]}
    />
  );
}
