import type { Metadata } from "next";
import { requireStaff } from "@/infra/auth/guards";
import { panelDeVisitas } from "@/domain/visitas/service";
import { AdminCard, AdminPageHeader } from "@/components/admin/admin-ui";
import { VisitasChart } from "@/components/admin/charts";

export const metadata: Metadata = { title: "Visitas" };
export const dynamic = "force-dynamic";

function Numero({ titulo, visitas, personas }: { titulo: string; visitas: number; personas: number }) {
  return (
    <AdminCard title={titulo}>
      <p className="text-[32px] font-light leading-none tabular text-carbon-900">
        {personas.toLocaleString("es-AR")}
      </p>
      <p className="mt-1.5 text-[13px] text-stone-500">
        {personas === 1 ? "persona" : "personas"} · {visitas.toLocaleString("es-AR")}{" "}
        {visitas === 1 ? "página vista" : "páginas vistas"}
      </p>
    </AdminCard>
  );
}

/*
  Lista simple y no AdminTable: esa tabla tiene un ancho mínimo de 720px
  pensado para las pantallas de pedidos, y dentro de una tarjeta a media
  pantalla la columna de la derecha se va afuera del borde. Son dos listas de
  dos datos; una tabla no aporta nada.

  La barra de fondo es proporcional al más visto, para poder comparar de un
  vistazo sin leer los números.
*/
function Ranking({
  filas,
  vacio,
  mono = false,
}: {
  filas: { nombre: string; visitas: number }[];
  vacio: string;
  mono?: boolean;
}) {
  if (filas.length === 0) {
    return <p className="py-8 text-center text-[13px] text-stone-500">{vacio}</p>;
  }
  const mayor = Math.max(...filas.map((f) => f.visitas));

  return (
    <ul className="space-y-1">
      {filas.map((f) => (
        <li key={f.nombre} className="relative flex items-center justify-between gap-3 rounded-xs px-2.5 py-2">
          <span
            aria-hidden
            className="absolute inset-y-0 left-0 rounded-xs bg-linen-200"
            style={{ width: `${Math.max(4, (f.visitas / mayor) * 100)}%` }}
          />
          <span className={`relative min-w-0 truncate text-[13px] text-carbon-900 ${mono ? "font-mono text-[12px]" : ""}`}>
            {f.nombre}
          </span>
          <span className="relative shrink-0 tabular text-[13px] text-stone-600">
            {f.visitas.toLocaleString("es-AR")}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default async function AdminVisitasPage() {
  await requireStaff("reports.view");
  const datos = await panelDeVisitas();

  const totalDispositivos = datos.movil + datos.escritorio;
  const porcentajeMovil = totalDispositivos > 0 ? Math.round((datos.movil / totalDispositivos) * 100) : 0;

  return (
    <>
      <AdminPageHeader
        title="Visitas"
        description="Cuánta gente entra al sitio. Se cuenta acá mismo, sin Google Analytics ni pixel de nadie: los datos no salen del servidor."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Numero titulo="Hoy" visitas={datos.hoy.visitas} personas={datos.hoy.personas} />
        <Numero titulo="Últimos 7 días" visitas={datos.siete.visitas} personas={datos.siete.personas} />
        <Numero titulo="Últimos 30 días" visitas={datos.treinta.visitas} personas={datos.treinta.personas} />
      </div>

      <AdminCard title="Día a día" description="Últimos 30 días." className="mt-6">
        {datos.serie.length === 0 ? (
          <p className="py-10 text-center text-[14px] text-stone-500">
            Todavía no hay visitas registradas. Aparecen acá apenas alguien entre al sitio.
          </p>
        ) : (
          <VisitasChart
            data={datos.serie.map((d) => ({
              dia: d.dia.toISOString().slice(0, 10),
              visitas: d.visitas,
              personas: d.personas,
            }))}
          />
        )}
      </AdminCard>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <AdminCard title="Páginas más vistas" description="Últimos 30 días.">
          <Ranking
            mono
            filas={datos.paginas.map((p) => ({ nombre: p.path, visitas: p.visitas }))}
            vacio="Sin datos todavía."
          />
        </AdminCard>

        <AdminCard
          title="De dónde vienen"
          description="Sólo cuando el navegador lo informa. Quien entra escribiendo la dirección o desde una app no aparece acá."
        >
          <Ranking
            filas={datos.referentes.map((r) => ({ nombre: r.de, visitas: r.visitas }))}
            vacio="Sin datos todavía."
          />
        </AdminCard>
      </div>

      {totalDispositivos > 0 && (
        <AdminCard title="Teléfono o computadora" description="Últimos 30 días." className="mt-6">
          <p className="text-[15px] text-carbon-900">
            <strong className="font-medium">{porcentajeMovil}%</strong> entra desde el teléfono
            <span className="text-stone-500">
              {" "}
              ({datos.movil.toLocaleString("es-AR")} de {totalDispositivos.toLocaleString("es-AR")} páginas vistas)
            </span>
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-pill bg-linen-200">
            <div className="h-full bg-accent-700" style={{ width: `${porcentajeMovil}%` }} />
          </div>
        </AdminCard>
      )}

      {/*
        Decir qué mide cada número, porque "visitas" y "personas" se confunden
        y la diferencia cambia cómo se lee la pantalla entera.
      */}
      <AdminCard title="Cómo se cuenta" className="mt-6">
        <ul className="space-y-2 text-[13px] leading-relaxed text-stone-600">
          <li>
            <strong className="font-medium text-carbon-900">Personas</strong> son visitantes distintos.
            Alguien que mira seis vinos cuenta como una persona y siete páginas vistas. En los períodos
            de varios días se suman las personas de cada día: quien vuelve mañana cuenta de nuevo.
          </li>
          <li>
            <strong className="font-medium text-carbon-900">No se guarda nada personal.</strong> Ni IP
            ni navegador: se guarda un código que los mezcla con la fecha y un secreto del servidor, y
            que cambia todos los días. Por eso tampoco hace falta cartel de cookies.
          </li>
          <li>
            <strong className="font-medium text-carbon-900">Los robots no cuentan.</strong> El aviso lo
            manda el navegador con JavaScript, así que los rastreadores que sólo bajan el HTML quedan
            afuera solos, y los que se anuncian se descartan por nombre.
          </li>
          <li>
            El panel de administración y las páginas de servicio no se cuentan: lo que medimos es
            la gente que entra a la tienda.
          </li>
        </ul>
      </AdminCard>
    </>
  );
}
