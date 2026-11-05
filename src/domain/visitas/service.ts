import { prisma } from "@/infra/db/prisma";

/**
 * Las cuentas que muestra el panel.
 *
 * Dos números distintos y conviene no confundirlos: "visitas" son páginas
 * abiertas y "personas" son visitantes distintos en el período. Una misma
 * persona que mira seis vinos es 1 persona y 7 visitas.
 *
 * Las personas se cuentan por día y después se suman, porque la clave del
 * visitante cambia a medianoche: quien entra el lunes y el martes es una
 * persona cada día. Contar personas únicas de verdad a lo largo de un mes
 * pediría seguir a la gente entre días, que es justo lo que este diseño
 * evita. El número que da es "personas por día, sumadas", y así se nombra
 * en la pantalla para no prometer otra cosa.
 */
export type Resumen = {
  visitas: number;
  personas: number;
};

function desde(dias: number) {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - (dias - 1));
  return d;
}

async function contar(desdeCuando: Date): Promise<Resumen> {
  const [visitas, porDia] = await Promise.all([
    prisma.pageView.count({ where: { createdAt: { gte: desdeCuando } } }),
    prisma.$queryRaw<{ personas: bigint }[]>`
      SELECT COUNT(*)::bigint AS personas FROM (
        SELECT DISTINCT "visitorKey", date_trunc('day', "createdAt")
        FROM "PageView" WHERE "createdAt" >= ${desdeCuando}
      ) t
    `,
  ]);
  return { visitas, personas: Number(porDia[0]?.personas ?? 0) };
}

export async function panelDeVisitas() {
  const [hoy, siete, treinta, serie, paginas, referentes, dispositivos] = await Promise.all([
    contar(desde(1)),
    contar(desde(7)),
    contar(desde(30)),
    prisma.$queryRaw<{ dia: Date; visitas: bigint; personas: bigint }[]>`
      SELECT date_trunc('day', "createdAt") AS dia,
             COUNT(*)::bigint AS visitas,
             COUNT(DISTINCT "visitorKey")::bigint AS personas
      FROM "PageView" WHERE "createdAt" >= ${desde(30)}
      GROUP BY 1 ORDER BY 1 ASC
    `,
    prisma.$queryRaw<{ path: string; visitas: bigint }[]>`
      SELECT "path", COUNT(*)::bigint AS visitas
      FROM "PageView" WHERE "createdAt" >= ${desde(30)}
      GROUP BY 1 ORDER BY 2 DESC LIMIT 12
    `,
    prisma.$queryRaw<{ referrer: string; visitas: bigint }[]>`
      SELECT "referrer", COUNT(*)::bigint AS visitas
      FROM "PageView" WHERE "createdAt" >= ${desde(30)} AND "referrer" IS NOT NULL
      GROUP BY 1 ORDER BY 2 DESC LIMIT 8
    `,
    prisma.$queryRaw<{ "isMobile": boolean; visitas: bigint }[]>`
      SELECT "isMobile", COUNT(*)::bigint AS visitas
      FROM "PageView" WHERE "createdAt" >= ${desde(30)}
      GROUP BY 1
    `,
  ]);

  const movil = Number(dispositivos.find((d) => d.isMobile)?.visitas ?? 0);
  const escritorio = Number(dispositivos.find((d) => !d.isMobile)?.visitas ?? 0);

  return {
    hoy,
    siete,
    treinta,
    serie: serie.map((f) => ({
      dia: f.dia,
      visitas: Number(f.visitas),
      personas: Number(f.personas),
    })),
    paginas: paginas.map((p) => ({ path: p.path, visitas: Number(p.visitas) })),
    referentes: referentes.map((r) => ({ de: r.referrer, visitas: Number(r.visitas) })),
    movil,
    escritorio,
  };
}

export type PanelDeVisitas = Awaited<ReturnType<typeof panelDeVisitas>>;
