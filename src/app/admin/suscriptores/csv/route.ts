import { NextResponse } from "next/server";
import { requireStaff } from "@/infra/auth/guards";
import { prisma } from "@/infra/db/prisma";
import { etiquetaDeOrigenDeSuscripcion } from "@/domain/promotions/origen";

/**
 * La lista de mails, para pegar en la herramienta de envíos.
 *
 * Respeta los mismos filtros que la pantalla, así que lo que se descarga es
 * lo que se está mirando. Sin tope de 500: el CSV se baja para usarlo entero.
 */
export async function GET(request: Request) {
  await requireStaff("customers.view");

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  const origen = searchParams.get("origen");
  const bajas = searchParams.get("bajas");

  const subscribers = await prisma.newsletterSubscriber.findMany({
    where: {
      ...(bajas ? {} : { isActive: true }),
      ...(origen ? { source: origen } : {}),
      ...(q
        ? {
            OR: [
              { email: { contains: q, mode: "insensitive" as const } },
              { name: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    orderBy: { consentAt: "desc" },
  });

  const filas = [
    ["email", "nombre", "origen", "consintio", "fecha_consentimiento", "activo"],
    ...subscribers.map((s) => [
      s.email,
      s.name ?? "",
      etiquetaDeOrigenDeSuscripcion(s.source),
      s.consent ? "si" : "no",
      s.consentAt.toISOString().slice(0, 10),
      s.isActive ? "si" : "no",
    ]),
  ];

  /*
    BOM al principio para que Excel en Windows abra los acentos bien. Sin eso,
    "Martín" llega como "MartÃ­n" y alguien termina corrigiendo la lista a mano.
  */
  const csv = "﻿" + filas.map((fila) => fila.map(entrecomillar).join(",")).join("\r\n");
  const hoy = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="suscriptores-${hoy}.csv"`,
      // Es una lista de datos personales: que no quede en ninguna caché.
      "Cache-Control": "no-store",
    },
  });
}

/**
 * Entrecomilla un valor de CSV.
 *
 * El apóstrofe de apertura delante de `=`, `+`, `-` y `@` no es decorativo:
 * sin él, un nombre que empiece con esos signos lo ejecuta Excel como
 * fórmula al abrir el archivo.
 */
function entrecomillar(valor: string): string {
  const seguro = /^[=+\-@\t\r]/.test(valor) ? `'${valor}` : valor;
  return `"${seguro.replace(/"/g, '""')}"`;
}
