import { NextResponse } from "next/server";
import { prisma } from "@/infra/db/prisma";
import { clientIp, rateLimit } from "@/infra/security/rate-limit";
import { leerConfigEnviopack, trackingEnviopack } from "@/infra/shipping/enviopack";

/**
 * Avisos de Envíopack sobre un envío.
 *
 * Llegan como GET con dos datos: el tipo —"envio-procesado" o
 * "envio-cambio-condicion"— y el id del envío. Esperan HTTP 200 en menos de
 * cinco segundos y reintentan diez veces, cada dos minutos, si no lo reciben.
 *
 * Seguridad: Envíopack no firma sus llamadas ni publica un rango de IPs, así
 * que la URL que se registra lleva un secreto propio. Esa es la primera
 * barrera, pero no es la que importa: el aviso no trae ningún dato que se
 * crea. Sólo dice "mirá este envío", y los datos se leen después contra la
 * API con nuestras credenciales. Una llamada falsificada, en el peor caso,
 * nos hace releer un envío nuestro.
 */

export async function GET(request: Request) {
  const url = new URL(request.url);
  const tipo = url.searchParams.get("tipo") ?? "";
  const id = url.searchParams.get("id") ?? "";

  const limit = rateLimit(`webhook:enviopack:${clientIp(request.headers)}`, {
    limit: 120,
    windowSeconds: 60,
  });
  if (!limit.allowed) {
    return NextResponse.json({ error: "Demasiadas solicitudes." }, { status: 429 });
  }

  const esperado = process.env.ENVIOPACK_WEBHOOK_SECRET?.trim();
  /*
    Sin secreto configurado se rechaza, no se deja pasar. Un endpoint que
    escribe en la base y queda abierto porque faltó una variable es la clase
    de descuido que no se nota hasta que alguien lo encuentra.
  */
  if (!esperado || url.searchParams.get("secreto") !== esperado) {
    console.warn("[webhook:enviopack] rechazado — secreto inválido o sin configurar");
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  if (!id) {
    // 200 porque reintentar no lo va a arreglar: el aviso vino incompleto.
    return NextResponse.json({ ok: true, ignorado: "sin id" }, { status: 200 });
  }

  /*
    Se busca el envío antes de mirar las credenciales. Un aviso sobre algo que
    no es nuestro nunca se va a poder resolver, así que conviene cerrarlo con
    un 200 aunque falte configurar la cuenta: si no, reintentan diez veces por
    un envío que no existe acá.
  */
  const shipment = await prisma.shipment.findFirst({ where: { externalId: id } });
  if (!shipment) {
    /*
      200 a propósito: puede ser un envío creado desde el panel de Envíopack y
      que no exista acá. Devolver error haría que reintenten diez veces algo
      que nunca va a resolverse.
    */
    return NextResponse.json({ ok: true, ignorado: "envío desconocido" }, { status: 200 });
  }

  const config = leerConfigEnviopack();
  if (!config) {
    // 500 para que reintenten: puede ser un despliegue a medio configurar.
    return NextResponse.json({ error: "Envíopack sin credenciales." }, { status: 500 });
  }

  try {
    const tracking = await trackingEnviopack(config, id);
    const envio = await prisma.shipment.findUnique({ where: { id: shipment.id } });

    await prisma.$transaction(async (tx) => {
      await tx.shipment.update({
        where: { id: shipment.id },
        data: {
          status: tracking.status,
          trackingUrl: tracking.trackingUrl ?? envio?.trackingUrl,
          deliveredAt: tracking.deliveredAt ?? envio?.deliveredAt,
          dispatchedAt:
            envio?.dispatchedAt ??
            (tracking.status === "IN_TRANSIT" || tracking.status === "DELIVERED"
              ? new Date()
              : null),
          rawPayload: { tipo, eventos: tracking.events.length },
        },
      });

      /*
        Se guardan sólo los eventos nuevos. El correo manda el historial
        completo en cada aviso, y sin esto cada notificación duplicaría todo
        lo anterior en la página de seguimiento del cliente.
      */
      const yaGuardados = await tx.shipmentEvent.findMany({
        where: { shipmentId: shipment.id },
        select: { description: true, occurredAt: true },
      });
      const clave = (d: string, f: Date) => `${d}@${f.toISOString()}`;
      const vistos = new Set(yaGuardados.map((e) => clave(e.description ?? "", e.occurredAt)));

      const nuevos = tracking.events.filter((e) => !vistos.has(clave(e.description, e.occurredAt)));
      if (nuevos.length > 0) {
        await tx.shipmentEvent.createMany({
          data: nuevos.map((e) => ({
            shipmentId: shipment.id,
            status: e.status,
            description: e.description,
            occurredAt: e.occurredAt,
          })),
        });
      }
    });

    return NextResponse.json({ ok: true, estado: tracking.status }, { status: 200 });
  } catch (error) {
    console.error("[webhook:enviopack] falló", error);
    // 500 para que reintenten: puede ser un corte momentáneo de su API.
    return NextResponse.json({ error: "No pudimos leer el envío." }, { status: 500 });
  }
}
