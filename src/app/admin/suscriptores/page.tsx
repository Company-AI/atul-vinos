import type { Metadata } from "next";
import Link from "next/link";
import { Download } from "lucide-react";
import { requireStaff } from "@/infra/auth/guards";
import { prisma } from "@/infra/db/prisma";
import { etiquetaDeOrigenDeSuscripcion } from "@/domain/promotions/origen";
import { formatDate } from "@/lib/dates";
import { AdminCard, AdminPageHeader, AdminTable, Td } from "@/components/admin/admin-ui";
import { Badge } from "@/ui/badge";
import { buttonVariants } from "@/ui/button";
import { Input } from "@/ui/field";

export const metadata: Metadata = { title: "Suscriptores" };

type PageProps = { searchParams: Promise<{ q?: string; origen?: string; bajas?: string }> };

/**
 * La lista de mails para mandar novedades.
 *
 * Existe porque los mails se venían guardando y nadie los podía mirar: la
 * ventana de bienvenida, el pie y el checkout escribían en esta tabla y no
 * había ninguna pantalla que la leyera. Pedirle el mail a alguien y después
 * no poder sacarlo es quedarse con el dato y sin el uso.
 *
 * La fecha de consentimiento se muestra siempre, y no como un detalle: es lo
 * que respalda poder escribirle a esa persona.
 */
export default async function AdminSubscribersPage({ searchParams }: PageProps) {
  await requireStaff("customers.view");
  const { q, origen, bajas } = await searchParams;

  const where = {
    // Por defecto sólo los que siguen suscriptos: es la lista que se usa.
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
  };

  const [subscribers, total, activos, origenes] = await Promise.all([
    prisma.newsletterSubscriber.findMany({ where, orderBy: { consentAt: "desc" }, take: 500 }),
    prisma.newsletterSubscriber.count(),
    prisma.newsletterSubscriber.count({ where: { isActive: true } }),
    prisma.newsletterSubscriber.groupBy({ by: ["source"], _count: { _all: true } }),
  ]);

  const parametros = new URLSearchParams();
  if (q) parametros.set("q", q);
  if (origen) parametros.set("origen", origen);
  if (bajas) parametros.set("bajas", bajas);
  const consulta = parametros.toString();

  const filtroOrigen = (valor: string | null, etiqueta: string) => {
    const p = new URLSearchParams(consulta);
    if (valor) p.set("origen", valor);
    else p.delete("origen");
    return (
      <Link
        key={etiqueta}
        href={`/admin/suscriptores${p.toString() ? `?${p}` : ""}`}
        className={buttonVariants({
          variant: (origen ?? null) === valor ? "dark" : "subtle",
          size: "sm",
        })}
      >
        {etiqueta}
      </Link>
    );
  };

  return (
    <>
      <AdminPageHeader
        title="Suscriptores"
        description={`${activos} suscriptos de ${total} registros. Se muestran los 500 más recientes.`}
        actions={
          <Link
            href={`/admin/suscriptores/csv${consulta ? `?${consulta}` : ""}`}
            prefetch={false}
            className={buttonVariants({ variant: "dark", size: "sm" })}
          >
            <Download className="size-3.5" />
            Descargar CSV
          </Link>
        }
      />

      <form className="mb-3 flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-wider text-stone-500">Buscar</span>
          <Input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Mail o nombre"
            className="h-8 w-64 text-[13px]"
          />
        </label>
        {origen && <input type="hidden" name="origen" value={origen} />}
        {bajas && <input type="hidden" name="bajas" value={bajas} />}
        <button type="submit" className={buttonVariants({ variant: "subtle", size: "sm" })}>
          Buscar
        </button>
      </form>

      <div className="mb-4 flex flex-wrap gap-2">
        {filtroOrigen(null, "Todos")}
        {origenes
          .filter((o) => o.source)
          .sort((a, b) => b._count._all - a._count._all)
          .map((o) =>
            filtroOrigen(
              o.source!,
              `${etiquetaDeOrigenDeSuscripcion(o.source)} (${o._count._all})`,
            ),
          )}
        <Link
          href={`/admin/suscriptores${bajas ? "" : "?bajas=1"}`}
          className={buttonVariants({ variant: bajas ? "dark" : "subtle", size: "sm" })}
        >
          Incluir bajas
        </Link>
      </div>

      <AdminCard padded={false}>
        <AdminTable
          headers={["Mail", "Nombre", "De dónde salió", "Consintió el", "Estado"]}
          empty={
            <p className="text-[13px] text-stone-500">
              Todavía no hay nadie con ese filtro.
            </p>
          }
        >
          {subscribers.map((s) => (
            <tr key={s.id}>
              <Td className="text-[12px]">{s.email}</Td>
              <Td className="text-[12px]">{s.name || <span className="text-stone-400">—</span>}</Td>
              <Td className="text-[12px] text-stone-500">
                {etiquetaDeOrigenDeSuscripcion(s.source)}
              </Td>
              <Td className="whitespace-nowrap tabular text-stone-500">
                {s.consent ? formatDate(s.consentAt) : "—"}
              </Td>
              <Td>
                {s.isActive ? (
                  <Badge tone="success">Suscripto</Badge>
                ) : (
                  <Badge tone="neutral">Se dio de baja</Badge>
                )}
              </Td>
            </tr>
          ))}
        </AdminTable>
      </AdminCard>
    </>
  );
}
