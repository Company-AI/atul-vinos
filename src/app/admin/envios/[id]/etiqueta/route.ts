import { NextResponse } from "next/server";
import { requireStaff } from "@/infra/auth/guards";
import { prisma } from "@/infra/db/prisma";
import { getShippingProvider } from "@/infra/shipping/registry";

/**
 * Descarga la etiqueta que emitió el correo.
 *
 * Es una ruta y no una acción de servidor porque lo que devuelve es un
 * archivo, no datos: el navegador tiene que poder abrir el PDF e imprimirlo.
 *
 * La etiqueta propia —la hoja con código de barras que dibuja el sistema— vive
 * en /admin/etiquetas y sirve para los envíos que hacemos nosotros. Esta otra
 * la emite el correo, lleva su numeración y su código de ruteo, y es la única
 * que acepta cuando pasa a retirar.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireStaff("orders.labels");
  const { id } = await params;

  const shipment = await prisma.shipment.findUnique({
    where: { id },
    include: { carrier: true },
  });
  if (!shipment) {
    return NextResponse.json({ error: "No encontramos ese envío." }, { status: 404 });
  }

  const provider = getShippingProvider(shipment.carrier?.code);

  if (!provider.getLabel) {
    return NextResponse.json(
      {
        error:
          `${provider.name} no emite etiquetas propias. ` +
          "Usá la hoja de etiquetas del sistema, en Envíos y etiquetas.",
      },
      { status: 409 },
    );
  }

  if (!shipment.externalId) {
    return NextResponse.json(
      { error: "Este envío no se generó en el correo, así que no tiene etiqueta de ellos." },
      { status: 409 },
    );
  }

  try {
    const label = await provider.getLabel(shipment.externalId);
    if (!label) {
      return NextResponse.json(
        { error: "El correo todavía no tiene la etiqueta lista." },
        { status: 409 },
      );
    }

    return new NextResponse(label.data, {
      headers: {
        "Content-Type": label.contentType,
        // inline: se abre en el visor del navegador, listo para imprimir.
        "Content-Disposition": `inline; filename="${label.filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No pudimos traer la etiqueta." },
      { status: 502 },
    );
  }
}
